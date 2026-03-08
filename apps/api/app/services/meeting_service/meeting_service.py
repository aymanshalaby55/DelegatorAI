from fastapi import Depends, HTTPException
from supabase import AsyncClient

from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.models.ApiResponse import ApiResponse, success_response
from app.models.meetings.JoinMeetingRequest import JoinMeetingRequest
from app.services.meeting_providers.factory import MeetingProviderFactory


class MeetingService:
    def __init__(self, supabase: AsyncClient, settings: Settings):
        self.supabase = supabase
        self.default_provider = settings.default_meeting_provider

    async def get_user_meeting(self, meeting_id: str, user_id: str) -> ApiResponse:
        result = await (
            self.supabase.table("meetings")
            .select("*")
            .eq("id", meeting_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return success_response("Meeting fetched successfully", data=result.data[0])

    async def get_user_meetings(self, user_id: str) -> ApiResponse:
        result = await (
            self.supabase.table("meetings").select("*").filter("user_id", "eq", user_id).order("created_at", desc=False).execute()
        )
        return success_response("Meetings fetched successfully", data=result.data)

    async def join_meeting(self, user: dict, data: JoinMeetingRequest) -> ApiResponse:
        """Send bot to meeting and save record to DB"""
        try:
            provider = MeetingProviderFactory.get(self.default_provider)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid meeting provider: {self.default_provider}",
            )

        try:
            bot = await provider.join(
                meeting_url=str(data.meeting_url),
                bot_name=f"{user['name'].split(' ')[0]} DelegatorBot",
            )
            bot_id = bot.get("data", {}).get("bot_id", "unknown")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to join meeting: {str(e)}"
            )

        try:
            result = await (
                self.supabase.table("meetings")
                .insert(
                    {
                        "user_id": user["id"],
                        "meeting_url": str(data.meeting_url),
                        "platform": str(data.meeting_url),
                        "bot_id": bot_id,
                        "provider": self.default_provider,
                        "status": "joining",
                        "title": data.title,
                    }
                )
                .execute()
            )
            if not result.data or not isinstance(result.data, list):
                raise Exception("Insert failed")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to save meeting: {str(e)}"
            )

        return success_response("Meeting joined successfully", data=result.data[0])

    async def leave_meeting(self, meeting_id: str, user_id: str) -> ApiResponse:
        """Remove bot from meeting and update status"""

        meeting_response = await self.get_user_meeting(meeting_id, user_id)
        meeting = meeting_response.data

        provider = MeetingProviderFactory.get(self.default_provider)
        try:
            await provider.leave(meeting["bot_id"])
        except Exception as e:
            msg = str(e)
            if (
                "FST_ERR_BOT_STATUS" in msg
                and "completed" in msg
                and "Operation not permitted in this state" in msg
            ):
                await (
                    self.supabase.table("meetings")
                    .update({"status": "left"})
                    .eq("id", meeting_id)
                    .execute()
                )
                return success_response(
                    "Meeting already completed or left, marked as left"
                )

            raise HTTPException(
                status_code=409, detail=f"Failed to leave meeting: {msg}"
            )

        await (
            self.supabase.table("meetings")
            .update({"status": "left"})
            .eq("id", meeting_id)
            .execute()
        )
        return success_response("Meeting left successfully")

    async def get_transcript(self, meeting_id: str, user_id: str) -> ApiResponse:
        """Get transcript for a completed meeting"""
        meeting_response = await self.get_user_meeting(meeting_id, user_id)
        meeting = meeting_response.data

        if meeting["status"] not in ["left", "completed", "processing"]:
            raise HTTPException(
                status_code=400,
                detail="Transcript not available — meeting is still active",
            )

        provider = MeetingProviderFactory.get(self.default_provider)
        try:
            if not meeting.get("bot_id"):
                raise HTTPException(status_code=400, detail="Missing bot_id")
            transcript = await provider.get_transcript(meeting["bot_id"])
            if not transcript or not isinstance(transcript, dict):
                raise HTTPException(status_code=404, detail="Transcript not found")
            return success_response("Transcript fetched successfully", data=transcript)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=502, detail=f"Failed to get transcript: {str(e)}"
            )


async def get_meeting_service(
    supabase: AsyncClient = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> MeetingService:
    """Inject both Supabase + Settings into the service"""
    return MeetingService(supabase, settings)
