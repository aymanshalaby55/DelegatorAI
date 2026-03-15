from typing import AsyncGenerator

from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.llm.factory import LLMProviderFactory
from app.models.meetings.GenerateSummaryRequest import GenerateSummaryRequest
from app.services.summary_service.prompts import build_summary_messages
from fastapi import Depends, HTTPException
from supabase import AsyncClient


class SummaryService:
    def __init__(self, supabase: AsyncClient, settings: Settings) -> None:
        self.supabase = supabase
        self.settings = settings

    def _get_api_key(self) -> str | None:
        provider = self.settings.default_llm_provider
        key_map = {
            "gemini": self.settings.gemini_api_key,
            "openai": self.settings.openai_api_key,
            "anthropic": self.settings.anthropic_api_key,
        }
        return key_map.get(provider) or None

    async def _get_meeting(self, meeting_id: str, user_id: str) -> dict:
        result = await (
            self.supabase.table("meetings")
            .select("*")
            .eq("id", str(meeting_id))
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return result.data[0]

    async def generate_summary_stream(
        self,
        meeting_id: str,
        user_id: str,
        request: GenerateSummaryRequest,
    ) -> AsyncGenerator[str, None]:
        meeting = await self._get_meeting(meeting_id, user_id)

        transcript: str | None = meeting.get("transcript")
        if not transcript or not transcript.strip():
            raise HTTPException(
                status_code=400,
                detail="No transcript available for this meeting",
            )

        messages = build_summary_messages(
            transcript=transcript,
            length=request.length,
            fmt=request.format,
        )

        provider = LLMProviderFactory.get(
            provider_name=self.settings.default_llm_provider,
            api_key=self._get_api_key(),
        )

        accumulated: list[str] = []

        async for chunk in provider.stream_completion(messages=messages):
            accumulated.append(chunk)
            yield chunk

        # Persist the completed summary to the database
        full_summary = "".join(accumulated)
        if full_summary:
            await (
                self.supabase.table("meetings")
                .update({"summary": full_summary})
                .eq("id", str(meeting_id))
                .execute()
            )


async def get_summary_service(
    supabase: AsyncClient = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> SummaryService:
    return SummaryService(supabase, settings)
