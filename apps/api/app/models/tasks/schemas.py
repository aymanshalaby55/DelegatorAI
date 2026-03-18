from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CreateTaskRequest(BaseModel):
    prompt: str


class TaskStep(BaseModel):
    name: str
    status: str  # pending | processing | completed | failed
    error: Optional[str] = None


class Subtask(BaseModel):
    title: str
    description: str
    labels: list[str] = []
    github_issue_number: Optional[int] = None
    github_issue_url: Optional[str] = None
    github_error: Optional[str] = None
    slack_status: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    user_id: str
    prompt: str
    status: str  # pending | processing | completed | failed
    steps: list[TaskStep] = []
    subtasks: list[Subtask] = []
    llm_output: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CreateTaskResponse(BaseModel):
    task_id: str
