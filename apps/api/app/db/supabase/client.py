from app.config import get_settings
from supabase import create_client, Client
from fastapi import Depends, HTTPException, status

def CreateSupabaseClient() -> Client:
    "get supabase client for the api"
    settings = get_settings()
    try:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
