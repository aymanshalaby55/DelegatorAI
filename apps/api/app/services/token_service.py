import logging
from datetime import datetime, timezone

from supabase import AsyncClient

logger = logging.getLogger(__name__)

TABLE = "user_integrations"


class TokenService:
    """
    Single-responsibility service for all token persistence.

    Handles all reads and writes to the user_integrations table.
    IntegrationManager composes this rather than talking to Supabase directly,
    keeping DB concerns out of orchestration logic.
    """

    def __init__(self, supabase: AsyncClient) -> None:
        self.supabase = supabase

    async def get(self, user_id: str, provider: str) -> dict | None:
        """Return a full integration record including tokens, or None."""
        result = await (
            self.supabase.table(TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("provider", provider)
            .execute()
        )
        return result.data[0] if result.data else None

    async def list_for_user(self, user_id: str) -> list[dict]:
        """Return all integrations for a user (without sensitive token fields)."""
        result = await (
            self.supabase.table(TABLE)
            .select("id, provider, expires_at, metadata, created_at")
            .eq("user_id", user_id)
            .execute()
        )
        return result.data or []

    async def upsert(
        self,
        user_id: str,
        provider: str,
        tokens: dict,
        metadata: dict | None = None,
    ) -> None:
        """Insert or update an integration record."""
        existing = await self.get(user_id, provider)
        payload = {
            "access_token": tokens.get("access_token", ""),
            "refresh_token": tokens.get("refresh_token"),
            "expires_at": tokens.get("expires_at"),
            "metadata": metadata or {},
        }

        if existing:
            await (
                self.supabase.table(TABLE)
                .update(payload)
                .eq("user_id", user_id)
                .eq("provider", provider)
                .execute()
            )
        else:
            await (
                self.supabase.table(TABLE)
                .insert({"user_id": user_id, "provider": provider, **payload})
                .execute()
            )

    async def delete(self, user_id: str, provider: str) -> None:
        """Remove an integration record."""
        await (
            self.supabase.table(TABLE)
            .delete()
            .eq("user_id", user_id)
            .eq("provider", provider)
            .execute()
        )

    @staticmethod
    def is_token_expired(expires_at: str | None) -> bool:
        """Return True if the given ISO timestamp is in the past."""
        if not expires_at:
            return False
        try:
            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            return expiry < datetime.now(timezone.utc)
        except ValueError:
            return False
