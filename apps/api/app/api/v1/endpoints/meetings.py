# app/routers/meetings.py
import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.ApiResponse import ApiResponse
from app.models.meetings.GenerateSummaryRequest import GenerateSummaryRequest
from app.models.meetings.JoinMeetingRequest import JoinMeetingRequest
from app.services.meeting_service.meeting_service import (
    MeetingService,
    get_meeting_service,
)
from app.services.meeting_service.task_extraction_service import (
    TaskExtractionService,
    get_task_extraction_service,
)
from app.services.meeting_service.task_push_service import (
    TaskPushService,
    get_task_push_service,
)
from app.services.summary_service.summary_service import (
    SummaryService,
    get_summary_service,
)


class NotifySlackRequest(BaseModel):
    task_ids: Optional[list[str]] = None


class PushGitHubRequest(BaseModel):
    assignees: Optional[list[str]] = None


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


@router.get("/tasks/all", response_model=ApiResponse)
async def get_all_user_tasks(
    unprocessed: bool = False,
    user: dict = Depends(get_current_user),
    service: TaskExtractionService = Depends(get_task_extraction_service),
):
    tasks = await service.get_all_user_tasks(
        user_id=user["id"], unprocessed_only=unprocessed
    )
    return ApiResponse(success=True, message="Tasks fetched", data=tasks)


@router.get("/{meeting_id}/tasks", response_model=ApiResponse)
async def get_meeting_tasks(
    meeting_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    service: TaskExtractionService = Depends(get_task_extraction_service),
):
    tasks = await service.get_tasks(meeting_id=str(meeting_id), user_id=user["id"])
    return ApiResponse(success=True, message="Tasks fetched", data=tasks)


@router.post("/{meeting_id}/tasks/extract", response_model=ApiResponse)
async def extract_meeting_tasks(
    meeting_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    service: TaskExtractionService = Depends(get_task_extraction_service),
):
    tasks = await service.extract_tasks(meeting_id=str(meeting_id), user_id=user["id"])
    return ApiResponse(success=True, message="Tasks extracted", data=tasks)


@router.post("/{meeting_id}/tasks/{task_id}/push/github", response_model=ApiResponse)
async def push_task_to_github(
    meeting_id: uuid.UUID,
    task_id: uuid.UUID,
    body: PushGitHubRequest = PushGitHubRequest(),
    user: dict = Depends(get_current_user),
    service: TaskPushService = Depends(get_task_push_service),
):
    updated_task = await service.push_to_github(
        task_id=str(task_id),
        user_id=user["id"],
        assignees_override=body.assignees,
    )
    return ApiResponse(success=True, message="GitHub issue created", data=updated_task)


@router.post("/{meeting_id}/tasks/notify/slack", response_model=ApiResponse)
async def notify_slack(
    meeting_id: uuid.UUID,
    body: NotifySlackRequest,
    user: dict = Depends(get_current_user),
    service: TaskPushService = Depends(get_task_push_service),
):
    result = await service.notify_slack(
        meeting_id=str(meeting_id),
        user_id=user["id"],
        task_ids=body.task_ids or None,
    )
    return ApiResponse(success=True, message="Slack notification sent", data=result)


@router.post("/{meeting_id}/summary/generate")
async def generate_summary(
    meeting_id: uuid.UUID,
    body: GenerateSummaryRequest,
    user: dict = Depends(get_current_user),
    service: SummaryService = Depends(get_summary_service),
):
    return StreamingResponse(
        service.generate_summary_stream(
            meeting_id=str(meeting_id), user_id=user["id"], request=body
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
