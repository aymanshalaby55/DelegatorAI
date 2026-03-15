from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class BotInfo:
    bot_id: str
    raw: dict


@dataclass
class TranscriptData:
    transcript: list
    recording_url: str | None
    speakers: list


class MeetingProvider(ABC):
    @abstractmethod
    async def join(self, meeting_url: str, bot_name: str) -> BotInfo:
        """Join a meeting and return structured bot info"""

    @abstractmethod
    async def leave(self, bot_id: str) -> None:
        """Remove the bot from a meeting"""

    @abstractmethod
    async def get_transcript(self, bot_id: str) -> TranscriptData:
        """Fetch transcript for a completed meeting"""
