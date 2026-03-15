from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
import jwt

from app.integrations.manager import IntegrationManager

STATE_JWT_ALGORITHM = "HS256"
STATE_JWT_EXPIRY_MINUTES = 10
SUPPORTED_PROVIDERS = IntegrationManager.supported_providers()


def _create_state_token(user_id: str, provider: str, secret: str) -> str:
    payload = {
        "sub": user_id,
        "provider": provider,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=STATE_JWT_EXPIRY_MINUTES),
    }
    return jwt.encode(payload, secret, algorithm=STATE_JWT_ALGORITHM)


def _verify_state_token(state: str, secret: str) -> dict:
    try:
        return jwt.decode(state, secret, algorithms=[STATE_JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=400,
            detail="OAuth state token has expired. Please try connecting again.",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=400, detail=f"Invalid OAuth state token: {e}")


def _require_supported_provider(provider: str) -> None:
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=404,
            detail=f"Provider '{provider}' is not supported. Supported: {SUPPORTED_PROVIDERS}",
        )
