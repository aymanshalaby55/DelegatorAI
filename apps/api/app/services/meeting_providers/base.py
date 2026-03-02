from abc import ABC, abstractmethod

class MeetingProvider(ABC):
    
    @abstractmethod
    async def join(self, meeting_url: str, bot_name: str) -> dict:
        """Join a meeting and return bot info"""
        pass
    
    @abstractmethod
    async def leave(self, bot_id: str) -> None:
        pass

    @abstractmethod
    async def get_transcript(self, bot_id: str) -> str:
        pass