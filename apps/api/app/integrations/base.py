from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable


class IntegrationProvider(ABC):
    """
    Core contract every provider must fulfill.
    Only the methods truly universal to ALL providers live here.
    """

    @abstractmethod
    def get_oauth_url(self, state: str) -> str:
        """Build the provider OAuth authorization URL including the state parameter."""

    @abstractmethod
    async def exchange_code(self, code: str) -> dict:
        """Exchange an authorization code for access/refresh tokens."""

    @abstractmethod
    def normalize_tokens(self, raw_tokens: dict) -> dict:
        """
        Return a consistent token dict from a provider-specific response.
        Must return: { access_token: str, refresh_token: str|None, expires_at: str|None }
        """

    @abstractmethod
    async def fetch_metadata(self, tokens: dict) -> dict:
        """
        Fetch and return provider-specific metadata to store after token exchange.
        Return an empty dict if the provider has no useful metadata.
        """


@runtime_checkable
class RefreshableProvider(Protocol):
    """
    Opt-in capability: providers whose access tokens can be refreshed.
    Check with: isinstance(provider, RefreshableProvider)
    """

    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Refresh an expired access token. Returns a new token dict."""
        ...


@runtime_checkable
class ActionableProvider(Protocol):
    """
    Opt-in capability: providers that support executing named actions.
    Check with: isinstance(provider, ActionableProvider)
    """

    def supported_actions(self) -> list[str]:
        """Return the list of action names this provider supports."""
        ...

    async def execute_action(
        self,
        action: str,
        token: str,
        payload: dict,
        metadata: dict,
    ) -> dict:
        """
        Execute a named action against the provider API.

        Args:
            action:   Name of the action (e.g. 'create_issue', 'post_message').
            token:    Provider access token for the authenticated user.
            payload:  Action-specific parameters (e.g. title, body, channel).
            metadata: Stored integration metadata (e.g. default_repo, default_channel).
        """
        ...
