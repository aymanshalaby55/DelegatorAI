import logging

from fastapi import Depends
from supabase import AsyncClient

from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.integrations.base import (
    IntegrationProvider,
    RefreshableProvider,
    ActionableProvider,
)
from app.integrations.registry import get_registry, get_provider_class
from app.services.token_service import TokenService

# Ensure all providers are registered before anything uses the manager.
import app.integrations.providers  # noqa: F401

logger = logging.getLogger(__name__)


class IntegrationManager:
    """
    Thin orchestrator that composes TokenService + provider instances.

    Responsibilities:
    - Instantiate providers from the registry (OCP: never modified for new providers)
    - Delegate all DB work to TokenService (SRP)
    - Use capability protocols (RefreshableProvider, ActionableProvider) to
      conditionally invoke optional provider features (ISP, LSP)
    """

    def __init__(self, supabase: AsyncClient, settings: Settings) -> None:
        self.settings = settings
        self.tokens = TokenService(supabase)

    # ------------------------------------------------------------------
    # Provider factory
    # ------------------------------------------------------------------

    def get_provider(self, name: str) -> IntegrationProvider:
        """Instantiate a provider by name. Raises ValueError for unknown names."""
        cls = get_provider_class(name)
        return cls(self.settings)

    @staticmethod
    def supported_providers() -> list[str]:
        return list(get_registry().keys())

    # ------------------------------------------------------------------
    # Token lifecycle — delegates to TokenService
    # ------------------------------------------------------------------

    async def get_user_integrations(self, user_id: str) -> list[dict]:
        return await self.tokens.list_for_user(user_id)

    async def get_integration(self, user_id: str, provider: str) -> dict | None:
        return await self.tokens.get(user_id, provider)

    async def store_tokens(
        self,
        user_id: str,
        provider: str,
        tokens: dict,
        metadata: dict | None = None,
    ) -> None:
        await self.tokens.upsert(user_id, provider, tokens, metadata)

    async def delete_integration(self, user_id: str, provider: str) -> None:
        await self.tokens.delete(user_id, provider)

    # ------------------------------------------------------------------
    # Token refresh — only attempted for RefreshableProvider instances
    # ------------------------------------------------------------------

    async def refresh_token_if_needed(
        self, user_id: str, provider_name: str
    ) -> dict | None:
        """
        Refresh the access token if it has expired and the provider supports it.

        Returns the updated integration record, or None if no refresh was needed/possible.
        """
        record = await self.tokens.get(user_id, provider_name)
        if not record:
            return None

        if not TokenService.is_token_expired(record.get("expires_at")):
            return None  # Token still valid, nothing to do

        provider = self.get_provider(provider_name)

        if not isinstance(provider, RefreshableProvider):
            logger.debug(f"{provider_name} tokens do not expire; skipping refresh.")
            return None

        refresh_token = record.get("refresh_token")
        if not refresh_token:
            raise ValueError(
                f"Cannot refresh {provider_name} token: no refresh_token stored."
            )

        new_tokens = await provider.refresh_access_token(refresh_token)
        normalized = provider.normalize_tokens(new_tokens)
        await self.tokens.upsert(
            user_id, provider_name, normalized, record.get("metadata")
        )

        logger.info(f"Refreshed {provider_name} token for user {user_id}")
        return await self.tokens.get(user_id, provider_name)

    # ------------------------------------------------------------------
    # Action execution — only attempted for ActionableProvider instances
    # ------------------------------------------------------------------

    async def execute_action(
        self,
        user_id: str,
        provider_name: str,
        action: str,
        payload: dict,
    ) -> dict:
        """
        Execute a named action for a user's connected integration.

        Automatically refreshes the token if expired and the provider supports it.
        Raises ValueError if the provider doesn't support actions.
        """
        record = await self.tokens.get(user_id, provider_name)
        if not record:
            raise ValueError(
                f"No active {provider_name} integration found for user {user_id}."
            )

        provider = self.get_provider(provider_name)

        if not isinstance(provider, ActionableProvider):
            raise ValueError(
                f"{provider_name} does not support action execution. "
                f"Providers with action support: "
                f"{[p for p in self.supported_providers() if isinstance(self.get_provider(p), ActionableProvider)]}"
            )

        # Auto-refresh if needed
        if TokenService.is_token_expired(record.get("expires_at")):
            refreshed = await self.refresh_token_if_needed(user_id, provider_name)
            if refreshed:
                record = refreshed

        return await provider.execute_action(
            action=action,
            token=record["access_token"],
            payload=payload,
            metadata=record.get("metadata") or {},
        )


async def get_integration_manager(
    supabase: AsyncClient = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> IntegrationManager:
    return IntegrationManager(supabase, settings)
