import logging
import json
from typing import Optional
import httpx
from app.core.config import get_settings
from fastapi import APIRouter, Request, HTTPException
from app.db.supabase.client import get_supabase_client
from svix.webhooks import Webhook, WebhookVerificationError

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()
supabase = get_supabase_client()


def _extract_event(payload: dict):
    event_type = payload.get("event", "")
    data = payload.get("data", {})
    bot_id = payload.get("bot_id") or data.get("bot_id")
    return event_type, data, bot_id


def _verify_svix_signature(secret: str, headers: dict, body: bytes) -> dict:
    wh = Webhook(secret)
    try:
        payload = wh.verify(body, headers)
        return payload
    except WebhookVerificationError as e:
        logger.warning(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")


async def _get_payload(request: Request) -> dict:
    body = await request.body()
    svix_headers = {
        "svix-id": request.headers.get("svix-id", ""),
        "svix-timestamp": request.headers.get("svix-timestamp", ""),
        "svix-signature": request.headers.get("svix-signature", ""),
    }
    if settings.meeting_baas_webhook_secret:
        return _verify_svix_signature(
            settings.meeting_baas_webhook_secret, svix_headers, body
        )
    return await request.json()


def _find_meeting(supabase, bot_id: str):
    try:
        result = supabase.table("meetings").select("*").eq("bot_id", bot_id).execute()
        if result.data:
            return result.data[0]
    except Exception as e:
        logger.warning(f"Error querying by 'bot_id': {e}")
    return None


def _map_meeting_status(event_type: str, data: dict) -> str:
    if event_type == "bot.completed":
        return "COMPLETED"
    if event_type == "bot.failed":
        return "FAILED"
    if event_type == "bot.status_change":
        status_obj = data.get("status", {})
        return status_obj.get("code", "ACTIVE")
    return "UNKNOWN"


def _format_utterances(utterances: list) -> Optional[str]:
    lines = []
    for entry in utterances:
        if not isinstance(entry, dict):
            continue
        speaker = entry.get("speaker", entry.get("name", entry.get("channel")))
        if speaker is None:
            speaker = "Speaker"
        elif isinstance(speaker, int):
            speaker = f"Speaker {speaker + 1}"
        else:
            speaker = str(speaker)

        text = entry.get("text", "")
        if isinstance(text, list):
            text = " ".join(
                w.get("word", w.get("text", "")) if isinstance(w, dict) else str(w)
                for w in text
            ).strip()
        else:
            text = str(text).strip()

        if text:
            lines.append(f"{speaker}: {text}")

    return "\n".join(lines) if lines else None


async def _fetch_and_store_transcript(meeting_id: str, transcript_url: str):
    if not transcript_url:
        logger.warning(f"No transcript URL provided for meeting {meeting_id}")
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(transcript_url, timeout=30)
            response.raise_for_status()
            fetched_data = response.json()

            transcript_json = fetched_data

            # Unwrap "transcript" key if it contains stringified JSON
            if isinstance(fetched_data, dict) and "transcript" in fetched_data:
                raw_transcript = fetched_data["transcript"]
                if isinstance(raw_transcript, str):
                    try:
                        transcript_json = json.loads(raw_transcript)
                    except json.JSONDecodeError as e:
                        logger.error(
                            f"Failed to decode stringified transcript JSON: {e}"
                        )

            elif isinstance(fetched_data, str):
                try:
                    transcript_json = json.loads(fetched_data)
                except json.JSONDecodeError as e:
                    logger.error(
                        f"Failed to decode stringified transcript response: {e}"
                    )

            # Unwrap "result" wrapper (structure: { bot_id, result: { utterances: [...] } })
            if isinstance(transcript_json, dict) and "result" in transcript_json:
                transcript_json = transcript_json["result"]

            # Extract utterances
            utterances = None
            if isinstance(transcript_json, dict):
                if "utterances" in transcript_json and isinstance(
                    transcript_json["utterances"], list
                ):
                    utterances = transcript_json["utterances"]
                elif "messages" in transcript_json and isinstance(
                    transcript_json["messages"], list
                ):
                    utterances = transcript_json["messages"]
            elif isinstance(transcript_json, list):
                utterances = transcript_json

            transcript_text = _format_utterances(utterances) if utterances else None

    except Exception as e:
        logger.error(
            f"Failed to download or parse transcript for meeting {meeting_id}: {e}"
        )
        return

    try:
        if transcript_text:
            supabase.table("meetings").update({"transcript": transcript_text}).eq(
                "id", meeting_id
            ).execute()
            logger.info(f"Stored transcript for meeting {meeting_id}")
        else:
            logger.warning(f"No transcript text extracted for meeting {meeting_id}")
    except Exception as e:
        logger.warning(f"Could not store transcript for meeting {meeting_id}: {e}")


async def _update_meeting(
    supabase, meeting_id: str, event_type: str, data: dict, status: str
):
    update_data = {"status": status}

    if event_type == "bot.completed":
        transcript_url = data.get("transcription")
        if transcript_url:
            print(transcript_url)
            await _fetch_and_store_transcript(meeting_id, transcript_url)

    supabase.table("meetings").update(update_data).eq("id", meeting_id).execute()


@router.post("/meeting-baas")
async def meeting_baas_webhook(request: Request):
    payload = await _get_payload(request)
    event_type, data, bot_id = _extract_event(payload)

    if not bot_id:
        return {"status": "ignored", "reason": "no bot_id"}

    meeting = _find_meeting(supabase, bot_id)
    if not meeting:
        return {"status": "ignored", "reason": "meeting not found"}

    status = _map_meeting_status(event_type, data)
    await _update_meeting(supabase, meeting["id"], event_type, data, status)

    return {"status": "ok"}
