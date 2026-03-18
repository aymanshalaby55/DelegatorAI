import logging
from urllib.parse import urlencode

import httpx

from app.core.config import Settings
from app.integrations.base import IntegrationProvider, ActionableProvider
from app.integrations.registry import register_provider

logger = logging.getLogger(__name__)

GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL = "https://api.github.com"
GITHUB_SCOPES = "repo issues:write read:user"


@register_provider("github")
class GitHubProvider(IntegrationProvider, ActionableProvider):
    """
    GitHub OAuth integration.

    Capabilities:
    - OAuth token exchange (IntegrationProvider)
    - Action execution: create_issue, list_repos (ActionableProvider)

    NOTE: GitHub tokens do not expire, so this provider intentionally does NOT
    implement RefreshableProvider.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def get_oauth_url(self, state: str) -> str:
        params = {
            "client_id": self.settings.github_client_id,
            "redirect_uri": self.settings.github_oauth_redirect_uri,
            "scope": GITHUB_SCOPES,
            "state": state,
        }
        return f"{GITHUB_OAUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GITHUB_TOKEN_URL,
                data={
                    "client_id": self.settings.github_client_id,
                    "client_secret": self.settings.github_client_secret,
                    "code": code,
                    "redirect_uri": self.settings.github_oauth_redirect_uri,
                },
                headers={"Accept": "application/json"},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            if "error" in data:
                raise ValueError(
                    f"GitHub token exchange failed: {data.get('error_description', data['error'])}"
                )
            return data

    def normalize_tokens(self, raw_tokens: dict) -> dict:
        """GitHub tokens are long-lived and have no refresh or expiry."""
        return {
            "access_token": raw_tokens.get("access_token", ""),
            "refresh_token": None,
            "expires_at": None,
        }

    async def fetch_metadata(self, tokens: dict) -> dict:
        """Fetch the authenticated user's GitHub profile for storage."""
        try:
            user_info = await self.get_user_info(tokens["access_token"])
            return {
                "login": user_info.get("login", ""),
                "name": user_info.get("name", ""),
                "avatar_url": user_info.get("avatar_url", ""),
            }
        except Exception as e:
            logger.warning(f"Could not fetch GitHub metadata: {e}")
            return {}

    def supported_actions(self) -> list[str]:
        return ["create_issue", "list_repos", "list_collaborators"]

    async def execute_action(
        self, action: str, token: str, payload: dict, metadata: dict
    ) -> dict:
        if action == "create_issue":
            return await self._create_issue(token, payload, metadata)
        if action == "list_repos":
            return await self._list_repos(token)
        if action == "list_collaborators":
            repo = payload.get("repo") or metadata.get("default_repo", "")
            return await self._list_collaborators(token, repo)
        raise ValueError(
            f"Unsupported GitHub action: '{action}'. Supported: {self.supported_actions()}"
        )

    async def get_user_info(self, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_URL}/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                },
                timeout=10,
            )
            response.raise_for_status()
            return response.json()

    async def _create_issue(self, token: str, payload: dict, metadata: dict) -> dict:
        repo = payload.get("repo") or metadata.get("default_repo")
        if not repo:
            raise ValueError(
                "GitHub repo is required. Set default_repo in your integration "
                "settings or pass it in the action payload."
            )

        assignees = payload.get("assignees", [])
        # Filter out empty strings
        assignees = [a for a in assignees if a]

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GITHUB_API_URL}/repos/{repo}/issues",
                json={
                    "title": payload.get("title", ""),
                    "body": payload.get("body", ""),
                    "labels": payload.get("labels", []),
                    "assignees": assignees,
                },
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                },
                timeout=15,
            )
            response.raise_for_status()
            return response.json()

    async def _list_collaborators(self, token: str, repo: str) -> dict:
        """Return collaborators for the given repo (owner + contributors with push access)."""
        if not repo:
            raise ValueError(
                "A repo is required to list collaborators. Set default_repo in your "
                "integration settings or pass it in the payload."
            )
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_URL}/repos/{repo}/collaborators",
                params={"per_page": 100, "affiliation": "all"},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                },
                timeout=15,
            )
            if response.status_code == 404:
                raise ValueError(
                    f"Repository '{repo}' not found or you don't have access."
                )
            response.raise_for_status()
            collaborators = response.json()
            return {
                "collaborators": [
                    {
                        "login": c["login"],
                        "avatar_url": c.get("avatar_url", ""),
                        "type": c.get("type", "User"),
                    }
                    for c in collaborators
                    if isinstance(c, dict) and c.get("type") != "Bot"
                ]
            }

    async def _list_repos(self, token: str) -> dict:
        """Return the user's repos sorted by most recently updated."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_URL}/user/repos",
                params={
                    "per_page": 50,
                    "sort": "updated",
                    "affiliation": "owner,collaborator",
                },
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                },
                timeout=15,
            )
            response.raise_for_status()
            repos = response.json()
            return {
                "repos": [
                    {"full_name": r["full_name"], "private": r["private"]}
                    for r in repos
                    if isinstance(r, dict)
                ]
            }
