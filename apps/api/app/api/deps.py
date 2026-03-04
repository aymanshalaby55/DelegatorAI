import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.db.supabase.supbaseJwks import get_public_key

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> dict:
    token = credentials.credentials
    try:
        # Get kid from token header
        header = jwt.get_unverified_header(token)
        kid = header["kid"]

        # Fetch matching public key
        public_key = get_public_key(kid, settings.supabase_url)

        payload = jwt.decode(
            token, public_key, algorithms=["ES256"], options={"verify_aud": False}
        )

        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("user_metadata", {}).get("full_name"),
            "avatar_url": payload.get("user_metadata", {}).get("avatar_url"),
        }

    except Exception as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
