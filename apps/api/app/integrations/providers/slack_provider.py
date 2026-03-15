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
SLACK_SCOPES = "chat:write,channels:read,channels:join"


@register_provider("slack")
class SlackProvider(IntegrationProvider, ActionableProvider):
    """
    Slack OAuth integration.

    Capabilities:
    - OAuth token exchange (IntegrationProvider)
    - Action execution: post_message, send_notification (ActionableProvider)

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
        return ["post_message", "send_notification"]

    async def execute_action(
        self, action: str, token: str, payload: dict, metadata: dict
    ) -> dict:
        if action in ("post_message", "send_notification"):
            return await self._post_message(token, payload, metadata)
        raise ValueError(
            f"Unsupported Slack action: '{action}'. Supported: {self.supported_actions()}"
        )

    async def _post_message(self, token: str, payload: dict, metadata: dict) -> dict:
        channel = payload.get("channel") or metadata.get("default_channel")
        if not channel:
            raise ValueError(
                "Slack channel is required. Set default_channel in your integration "
                "metadata or pass it in the action payload."
            )

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
                raise ValueError(
                    f"Slack post_message failed: {data.get('error', 'unknown error')}"
                )
            return data
