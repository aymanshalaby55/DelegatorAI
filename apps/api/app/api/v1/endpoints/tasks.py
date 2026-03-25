import asyncio
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user
from app.models.ApiResponse import ApiResponse, success_response
from app.models.tasks.schemas import CreateTaskRequest
from app.services.task_service.task_service import TaskService, get_task_service

router = APIRouter(tags=["tasks"])


@router.post("/", response_model=ApiResponse, status_code=201)
async def create_task(
    body: CreateTaskRequest,
    user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task_id = await service.create_task(user_id=user["id"], prompt=body.prompt)
    # Launch pipeline as background coroutine — detached from this request
    asyncio.create_task(
        service.run_pipeline(task_id=task_id, user_id=user["id"], prompt=body.prompt)
    )
    return success_response("Task created", data={"task_id": task_id})


@router.get("/", response_model=ApiResponse)
async def list_tasks(
    user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    tasks = await service.list_tasks(user_id=user["id"])
    return success_response("Tasks retrieved", data=tasks)


@router.get("/{task_id}", response_model=ApiResponse)
async def get_task(
    task_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id=str(task_id), user_id=user["id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return success_response("Task retrieved", data=task)


@router.post(
    "/{task_id}/subtasks/{subtask_index}/notify-slack", response_model=ApiResponse
)
async def notify_slack_subtask(
    task_id: uuid.UUID,
    subtask_index: int,
    user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    try:
        subtask = await service.notify_slack_subtask(
            task_id=str(task_id),
            user_id=user["id"],
            subtask_index=subtask_index,
        )
        return success_response("Slack message sent", data=subtask)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{task_id}/stream")
async def stream_task(
    task_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id=str(task_id), user_id=user["id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # If already completed/failed, send a single snapshot event and close
    if task["status"] in ("completed", "failed"):

        async def snapshot_generator():
            event = {
                "type": "completed" if task["status"] == "completed" else "error",
                "status": task["status"],
                "steps": task.get("steps", []),
                "subtasks": task.get("subtasks", []),
                "llm_output": task.get("llm_output"),
                "error": task.get("error"),
            }
            yield f"data: {json.dumps(event)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(
            snapshot_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    async def event_generator():
        queue = service.subscribe(str(task_id))
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                    if event.get("type") == "done":
                        break
                except asyncio.TimeoutError:
                    # keepalive comment to prevent proxy/browser timeout
                    yield ": keepalive\n\n"
        finally:
            service.unsubscribe(str(task_id), queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
