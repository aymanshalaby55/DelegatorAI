from app.db.supabase.client import CreateSupabaseClient
from app.services.meeting_providers.factory import MeetingProviderFactory
from app.models.meetings.JoinMeetingRequest import JoinMeetingRequest
from fastapi import HTTPException

supabase = CreateSupabaseClient()


def get_user_meeting(meeting_id: str, user_id: str) -> dict:
    """Fetch a meeting and verify the user owns it"""
    result = (
        supabase.table("meetings")
        .select("*")
        .eq("id", meeting_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return result.data[0]


def get_user_meetings(user_id: str) -> list:
    """Get all meetings for a user"""
    result = supabase.table("meetings").select("*").eq("user_id", user_id).execute()
    return result.data


async def join_meeting(
    user: dict, data: JoinMeetingRequest, provider_name: str
) -> dict:
    """Send bot to meeting and save record to DB"""
    try:
        provider = MeetingProviderFactory.get(provider_name)
    except Exception:
        raise HTTPException(
            status_code=400, detail=f"Invalid meeting provider: {provider_name}"
        )

    try:
        bot = await provider.join(
            meeting_url=str(data.meeting_url),
            bot_name=f"{user['name'].split(' ')[0]} DelegatorBot",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join meeting: {str(e)}")

    try:
        result = (
            supabase.table("meetings")
            .insert(
                {
                    "user_id": user["id"],
                    "meeting_url": str(data.meeting_url),
                    "platform": str(data.meeting_url),
                    "bot_id": bot.get("id"),
                    "provider": provider_name,
                    "status": "joining",
                    "title": data.title,
                }
            )
            .execute()
        )
        if not result.data or not isinstance(result.data, list):
            raise Exception("Insert failed or invalid response from DB.")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save meeting to database: {str(e)}"
        )

    print(result)
    return result.data[0]


async def leave_meeting(meeting_id: str, user_id: str, provider_name: str) -> dict:
    """Remove bot from meeting and update status"""
    meeting = get_user_meeting(meeting_id, user_id)

    provider = MeetingProviderFactory.get(provider_name)
    try:
        await provider.leave(meeting["bot_id"])
    except Exception as e:
        msg = str(e)
        if (
            "FST_ERR_BOT_STATUS" in msg
            and "completed" in msg
            and "Operation not permitted in this state" in msg
        ):
            supabase.table("meetings").update({"status": "left"}).eq(
                "id", meeting_id
            ).execute()
            return {"message": "Meeting already completed or left, marked as left"}
        # Any other error still raises HTTPException
        raise HTTPException(status_code=409, detail=f"Failed to leave meeting: {msg}")

    supabase.table("meetings").update({"status": "left"}).eq("id", meeting_id).execute()

    return {"message": "Meeting left successfully"}


async def get_transcript(meeting_id: str, user_id: str, provider_name: str) -> dict:
    """Get transcript for a completed meeting"""
    try:
        meeting = get_user_meeting(meeting_id, user_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Meeting not found: {str(e)}")

    if meeting["status"] not in ["left", "completed", "processing"]:
        raise HTTPException(
            status_code=400, detail="Transcript not available — meeting is still active"
        )

    provider = MeetingProviderFactory.get(provider_name)
    try:
        if not meeting.get("bot_id"):
            raise HTTPException(
                status_code=400, detail="Missing bot_id for transcript retrieval"
            )
        transcript = await provider.get_transcript(meeting["bot_id"])
        if not transcript or not isinstance(transcript, dict):
            raise HTTPException(
                status_code=404, detail="Transcript not found or invalid response"
            )
        return transcript
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to get transcript: {str(e)}"
        )
