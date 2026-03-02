from fastapi import APIRouter, Depends
from app.models.meetings.JoinMeetingRequest import JoinMeetingRequest
from app.core.config import get_settings, Settings
from app.api.deps import get_current_user
import app.services.meeting_service.meeting_service as meeting_service

router = APIRouter()


@router.get("/")
async def get_meetings(user: dict = Depends(get_current_user)):
    return  meeting_service.get_user_meetings(user["id"])


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str, user: dict = Depends(get_current_user)):
    return  meeting_service.get_user_meeting(meeting_id, user["id"])


@router.post("/join")
async def join_meeting(
    data: JoinMeetingRequest,
    user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    return await meeting_service.join_meeting(user, data, settings.default_meeting_provider)


@router.post("/{meeting_id}/leave")
async def leave_meeting(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    return await meeting_service.leave_meeting(meeting_id, user["id"], settings.default_meeting_provider)


@router.get("/{meeting_id}/transcript")
async def get_transcript(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    return await meeting_service.get_transcript(meeting_id, user["id"], settings.default_meeting_provider)