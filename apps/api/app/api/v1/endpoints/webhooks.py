import logging
from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError
from supabase import AsyncClient

from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.models.meetings.BotEvents import BotEvent, map_meeting_status
from app.services.meeting_service.webhooks_service import (
    find_meeting_by_bot_id,
    handle_webhook_update,
)
from app.utils.svix import get_verified_payload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/meeting-baas")
async def meeting_baas_webhook(
    request: Request,
    supabase: AsyncClient = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    payload = await get_verified_payload(request, settings.meeting_baas_webhook_secret)
    print(payload)
    try:
        event = BotEvent.model_validate(payload)
    except ValidationError as e:
        print(e)
        logger.warning(f"Unrecognised webhook payload: {e}")
        return {"status": "ignored", "reason": "unrecognised event"}
    print(event)
    if not event.bot_id:
        print("no bot_id")
        return {"status": "ignored", "reason": "no bot_id"}

    meeting = await find_meeting_by_bot_id(supabase, event.bot_id)
    if not meeting:
        return {"status": "ignored", "reason": "meeting not found"}

    status = map_meeting_status(event)
    await handle_webhook_update(
        supabase=supabase,
        meeting_id=meeting["id"],
        event_type=event.event,  # Pass event type string
        data=event.data.model_dump()
        if hasattr(event.data, "model_dump")
        else dict(event.data),
        status=status,
    )

    return {"status": "ok"}
