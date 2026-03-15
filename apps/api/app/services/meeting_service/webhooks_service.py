import logging
from supabase import AsyncClient
from app.utils.transcript import fetch_and_parse_transcript

logger = logging.getLogger(__name__)


async def find_meeting_by_bot_id(supabase: AsyncClient, bot_id: str) -> dict | None:
    try:
        result = (
            await supabase.table("meetings").select("*").eq("bot_id", bot_id).execute()
        )
        if result.data:
            return result.data[0]
    except Exception as e:
        logger.warning(f"Error querying meetings by bot_id: {e}")
    return None


async def handle_webhook_update(
    supabase: AsyncClient,
    meeting_id: str,
    event_type: str,
    data: dict,
    status: str,
) -> None:
    if event_type == "bot.completed":
        transcript_url = data.get("transcription")
        if transcript_url:
            try:
                transcript_text = await fetch_and_parse_transcript(transcript_url)
                if transcript_text:
                    await (
                        supabase.table("meetings")
                        .update({"transcript": transcript_text})
                        .eq("id", meeting_id)
                        .execute()
                    )
                    logger.info(f"Stored transcript for meeting {meeting_id}")
                else:
                    logger.warning(
                        f"No transcript text extracted for meeting {meeting_id}"
                    )
            except Exception as e:
                logger.error(
                    f"Failed to fetch/store transcript for meeting {meeting_id}: {e}"
                )

    await (
        supabase.table("meetings")
        .update({"status": status})
        .eq("id", meeting_id)
        .execute()
    )
