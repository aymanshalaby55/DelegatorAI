from app.db.supabase.client import get_supabase_client

supabase = get_supabase_client()


async def handle_bot_joined(event: dict):
    """Bot successfully joined the meeting"""
    bot_id = event["data"]["bot_id"]

    supabase.table("meetings").update(
        {
            "status": "active",
            "started_at": "now()",
        }
    ).eq("bot_id", bot_id).execute()


async def handle_bot_left(event: dict):
    """Bot left or was removed from the meeting"""
    bot_id = event["data"]["bot_id"]

    supabase.table("meetings").update(
        {
            "status": "completed",
            "ended_at": "now()",
        }
    ).eq("bot_id", bot_id).execute()


async def handle_transcript_ready(event: dict):
    """Transcript is ready — save it and trigger AI processing"""
    bot_id = event["data"]["bot_id"]
    transcript = event["data"]["transcript"]

    # Save transcript to DB
    await (
        supabase.table("meetings")
        .update(
            {
                "transcript": transcript,
                "status": "processing",
            }
        )
        .eq("bot_id", bot_id)
        .execute()
    )


async def handle_recording_ready(event: dict):
    """Recording URL is available"""
    bot_id = event["data"]["bot_id"]
    recording_url = event["data"]["recording_url"]

    supabase.table("meetings").update(
        {
            "recording_url": recording_url,
        }
    ).eq("bot_id", bot_id).execute()
