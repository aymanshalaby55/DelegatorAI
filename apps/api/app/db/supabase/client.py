from fastapi import HTTPException, status
from supabase import AsyncClient, acreate_client

from app.core.config import get_settings

_supabase_client: AsyncClient | None = None


# done use lru_cache breaks the app
async def get_supabase_client() -> AsyncClient:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    settings = get_settings()
    try:
        _supabase_client = await acreate_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
        return _supabase_client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
