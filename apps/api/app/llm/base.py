from abc import ABC, abstractmethod
from typing import AsyncGenerator


class LLMProvider(ABC):
    @abstractmethod
    async def stream_completion(
        self,
        messages: list[dict],
        model: str,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        """Stream completion tokens one chunk at a time."""
        ...

    @abstractmethod
    async def completion(
        self,
        messages: list[dict],
        model: str,
        **kwargs,
    ) -> str:
        """Return the full completion as a single string."""
        ...
