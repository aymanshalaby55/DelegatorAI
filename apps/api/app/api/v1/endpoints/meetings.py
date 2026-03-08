# app/routers/meetings.py
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user
from app.models.ApiResponse import ApiResponse
from app.models.meetings.GenerateSummaryRequest import GenerateSummaryRequest
from app.models.meetings.JoinMeetingRequest import JoinMeetingRequest
from app.services.meeting_service.meeting_service import (
    MeetingService,
    get_meeting_service,
)
from app.services.summary_service.summary_service import (
    SummaryService,
    get_summary_service,
)

router = APIRouter(tags=["meetings"])


@router.get("/", response_model=ApiResponse)
async def get_meetings(
    user: dict = Depends(get_current_user),
    service: MeetingService = Depends(get_meeting_service),
):
    return await service.get_user_meetings(user["id"])


@router.get("/{meeting_id}", response_model=ApiResponse)
async def get_meeting(
    meeting_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    service: MeetingService = Depends(get_meeting_service),
):
    return await service.get_user_meeting(meeting_id, user["id"])


@router.post("/join", response_model=ApiResponse, status_code=201)
async def join_meeting(
    data: JoinMeetingRequest,
    user: dict = Depends(get_current_user),
    service: MeetingService = Depends(get_meeting_service),
):
    return await service.join_meeting(user, data)


@router.post("/{meeting_id}/leave", response_model=ApiResponse)
async def leave_meeting(
    meeting_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    service: MeetingService = Depends(get_meeting_service),
):
    return await service.leave_meeting(meeting_id, user["id"])


@router.get("/{meeting_id}/transcript", response_model=ApiResponse)
async def get_transcript(
    meeting_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    service: MeetingService = Depends(get_meeting_service),
):
    return await service.get_transcript(meeting_id, user["id"])


@router.post("/{meeting_id}/summary/generate")
async def generate_summary(
    meeting_id: uuid.UUID,
    body: GenerateSummaryRequest,
    user: dict = Depends(get_current_user),
    service: SummaryService = Depends(get_summary_service),
):
    return StreamingResponse(
        service.generate_summary_stream(meeting_id=str(meeting_id), user_id=user["id"], request=body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
