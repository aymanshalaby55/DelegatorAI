from enum import StrEnum
from typing import Any
from pydantic import BaseModel, Field


class BotEventType(StrEnum):
    COMPLETED = "bot.completed"
    FAILED = "bot.failed"
    STATUS_CHANGE = "bot.status_change"


# Minimal meeting participant model, expand as needed
class MeetingParticipant(BaseModel):
    name: str
    id: int
    display_name: str | None = None
    profile_picture: str | None = None


class BotStatus(BaseModel):
    code: str = "ACTIVE"


class BotEventData(BaseModel):
    bot_id: str | None = None
    event_id: str | None = None
    participants: list[MeetingParticipant] | None = None
    speakers: list[MeetingParticipant] | None = None
    duration_seconds: int | None = None
    joined_at: str | None = None
    exited_at: str | None = None
    data_deleted: bool | None = None
    video: str | None = None
    audio: str | None = None
    diarization: str | None = None
    raw_transcription: str | None = None
    transcription: str | None = None
    transcription_provider: str | None = None
    transcription_ids: list[str] | None = None
    sent_at: str | None = None
    status: BotStatus = Field(default_factory=BotStatus)


class BotEvent(BaseModel):
    event: BotEventType
    data: BotEventData
    extra: Any = None

    @property
    def bot_id(self) -> str | None:
        # prefer top-level, fallback to nested
        return self.data.bot_id if self.data and self.data.bot_id else None


def map_meeting_status(event: BotEvent) -> str:
    match event.event:
        case BotEventType.COMPLETED:
            return "COMPLETED"
        case BotEventType.FAILED:
            return "FAILED"
        case BotEventType.STATUS_CHANGE:
            return event.data.status.code
