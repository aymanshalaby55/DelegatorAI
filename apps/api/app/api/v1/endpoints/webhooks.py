from app.services.meeting_service.webhooks_service import (
    handle_bot_joined,
    handle_bot_left,
    handle_transcript_ready,
    handle_recording_ready,
)
from app.core.config import get_settings
from fastapi import APIRouter, Request, HTTPException, Header
import hmac
import hashlib

router = APIRouter()
settings = get_settings()


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the webhook is actually from Meeting BaaS"""
    expected = hmac.new(
        settings.meeting_baas_webhook_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/meeting-baas")
async def meeting_baas_webhook(
    request: Request,
    x_meeting_baas_signature: str = Header(None),
):
    payload = await request.body()

    # Verify it's really from Meeting BaaS
    if not verify_signature(payload, x_meeting_baas_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = await request.json()
    event_type = event.get("event")

    if event_type == "bot.joined":
        await handle_bot_joined(event)

    elif event_type == "bot.left":
        await handle_bot_left(event)

    elif event_type == "transcript.ready":
        await handle_transcript_ready(event)

    elif event_type == "recording.ready":
        await handle_recording_ready(event)

    return {"status": "ok"}