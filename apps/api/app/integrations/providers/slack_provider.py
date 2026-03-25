import logging
from urllib.parse import urlencode

import httpx

from app.core.config import Settings
from app.integrations.base import IntegrationProvider, ActionableProvider
from app.integrations.registry import register_provider

logger = logging.getLogger(__name__)

SLACK_OAUTH_URL = "https://slack.com/oauth/v2/authorize"
SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access"
SLACK_API_URL = "https://slack.com/api"
SLACK_SCOPES = (
    "chat:write,channels:read,channels:join,groups:read,users:read,users:read.email"
)


@register_provider("slack")
class SlackProvider(IntegrationProvider, ActionableProvider):
    """
    Slack OAuth integration.

    Capabilities:
    - OAuth token exchange (IntegrationProvider)
    - Action execution: post_message, send_notification, list_channels (ActionableProvider)

    NOTE: Slack bot tokens do not expire, so this provider intentionally does NOT
    implement RefreshableProvider.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def get_oauth_url(self, state: str) -> str:
        params = {
            "client_id": self.settings.slack_client_id,
            "redirect_uri": self.settings.slack_oauth_redirect_uri,
            "scope": SLACK_SCOPES,
            "state": state,
        }
        return f"{SLACK_OAUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SLACK_TOKEN_URL,
                data={
                    "client_id": self.settings.slack_client_id,
                    "client_secret": self.settings.slack_client_secret,
                    "code": code,
                    "redirect_uri": self.settings.slack_oauth_redirect_uri,
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            if not data.get("ok"):
                raise ValueError(
                    f"Slack token exchange failed: {data.get('error', 'unknown error')}"
                )
            return data

    def normalize_tokens(self, raw_tokens: dict) -> dict:
        """Slack bot tokens are long-lived and have no refresh or expiry."""
        return {
            "access_token": raw_tokens.get("access_token", ""),
            "refresh_token": None,
            "expires_at": None,
        }

    async def fetch_metadata(self, tokens: dict) -> dict:
        """Extract team, user, and optional webhook metadata from the token response."""
        try:
            team = tokens.get("team") or {}
            authed_user = tokens.get("authed_user") or {}
            metadata: dict = {
                "team_id": team.get("id", ""),
                "team_name": team.get("name", ""),
                "authed_user_id": authed_user.get("id", ""),
            }
            incoming = tokens.get("incoming_webhook") or {}
            if incoming.get("channel"):
                metadata["default_channel"] = incoming["channel"]
            return metadata
        except Exception as e:
            logger.warning(f"Could not fetch Slack metadata: {e}")
            return {}

    def supported_actions(self) -> list[str]:
        return ["post_message", "send_notification", "list_channels"]

    async def execute_action(
        self, action: str, token: str, payload: dict, metadata: dict
    ) -> dict:
        if action in ("post_message", "send_notification"):
            return await self._post_message(token, payload, metadata)
        if action == "list_channels":
            return await self._list_channels(token)
        raise ValueError(
            f"Unsupported Slack action: '{action}'. Supported: {self.supported_actions()}"
        )

    async def lookup_slack_user(self, token: str, query: str) -> str:
        """
        Try to resolve a person's name or GitHub username to a Slack mention.

        Calls users.list and fuzzy-matches on display_name or real_name.
        Returns '<@USER_ID>' if found, else '*@{query}*' as a bold fallback.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{SLACK_API_URL}/users.list",
                    params={"limit": 200},
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10,
                )
                response.raise_for_status()
                data = response.json()
                if not data.get("ok"):
                    return f"*@{query}*"

                query_lower = query.lower()
                for member in data.get("members", []):
                    if member.get("deleted") or member.get("is_bot"):
                        continue
                    profile = member.get("profile", {})
                    candidates = [
                        profile.get("display_name", "").lower(),
                        profile.get("real_name", "").lower(),
                        member.get("name", "").lower(),
                    ]
                    if any(
                        query_lower in c or c == query_lower for c in candidates if c
                    ):
                        return f"<@{member['id']}>"
        except Exception as e:
            logger.warning("Slack user lookup failed for %r: %s", query, e)

        return f"*@{query}*"

    async def _join_channel(self, token: str, channel: str) -> None:
        """
        Attempt to join a public channel so the bot can post to it.
        Silently ignores errors for private channels (bot must be invited manually)
        and channels the bot has already joined.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{SLACK_API_URL}/conversations.join",
                    json={"channel": channel},
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10,
                )
                data = response.json()
                if not data.get("ok") and data.get("error") not in (
                    "method_not_supported_for_channel_type",
                    "already_in_channel",
                ):
                    logger.warning(
                        "conversations.join failed for channel %r: %s",
                        channel,
                        data.get("error"),
                    )
        except Exception as e:
            logger.warning("Could not join Slack channel %r: %s", channel, e)

    async def _post_message(self, token: str, payload: dict, metadata: dict) -> dict:
        channel = payload.get("channel") or metadata.get("default_channel")
        if not channel:
            raise ValueError(
                "Slack channel is required. Set default_channel in your integration "
                "settings or pass it in the action payload."
            )

        # Ensure the bot is in the channel before posting
        await self._join_channel(token, channel)

        body: dict = {
            "channel": channel,
            "text": payload.get("text", ""),
        }
        if payload.get("blocks"):
            body["blocks"] = payload["blocks"]

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SLACK_API_URL}/chat.postMessage",
                json=body,
                headers={"Authorization": f"Bearer {token}"},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            if not data.get("ok"):
                error = data.get("error", "unknown error")
                if error == "not_in_channel":
                    raise ValueError(
                        "The Slack bot is not in this channel. For private channels, "
                        "please invite the bot manually: /invite @YourBotName"
                    )
                raise ValueError(f"Slack post_message failed: {error}")
            return data

    async def _list_channels(self, token: str) -> dict:
        """Return channels the bot has access to.

        Tries public + private first (requires groups:read scope).
        Falls back to public-only if the token lacks groups:read.
        """
        async with httpx.AsyncClient() as client:
            for types in ("public_channel,private_channel", "public_channel"):
                response = await client.get(
                    f"{SLACK_API_URL}/conversations.list",
                    params={
                        "types": types,
                        "exclude_archived": "true",
                        "limit": 200,
                    },
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=15,
                )
                response.raise_for_status()
                data = response.json()

                if data.get("ok"):
                    channels = data.get("channels", [])
                    return {
                        "channels": [
                            {
                                "id": c["id"],
                                "name": c["name"],
                                "is_private": c.get("is_private", False),
                            }
                            for c in channels
                            if isinstance(c, dict)
                        ]
                    }

                error = data.get("error", "unknown_error")
                # missing_scope on private channels → retry with public only
                if error == "missing_scope" and "private_channel" in types:
                    logger.info(
                        "groups:read scope missing; retrying with public channels only"
                    )
                    continue

                raise ValueError(f"Slack conversations.list failed: {error}")

        return {"channels": []}
