import json
import logging
import re

from fastapi import Depends, HTTPException
from supabase import AsyncClient

from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.llm.factory import LLMProviderFactory
from app.services.meeting_service.task_extraction_prompts import (
    build_task_extraction_messages,
)

logger = logging.getLogger(__name__)


class TaskExtractionService:
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
            .eq("id", meeting_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return result.data[0]

    async def get_tasks(self, meeting_id: str, user_id: str) -> list[dict]:
        """Return all tasks for a meeting (verifies ownership first)."""
        await self._get_meeting(meeting_id, user_id)
        result = await (
            self.supabase.table("tasks")
            .select("*")
            .eq("meeting_id", meeting_id)
            .order("created_at", desc=False)
            .execute()
        )
        return result.data

    async def get_all_user_tasks(
        self, user_id: str, unprocessed_only: bool = False
    ) -> list[dict]:
        """Return all tasks across all meetings owned by this user.

        When unprocessed_only=True, only tasks without a github_issue_url are returned.
        Each task is enriched with its meeting title for display purposes.
        """
        meetings_result = await (
            self.supabase.table("meetings")
            .select("id, title")
            .eq("user_id", user_id)
            .execute()
        )
        if not meetings_result.data:
            return []

        meeting_ids = [m["id"] for m in meetings_result.data]
        meeting_titles: dict[str, str] = {
            m["id"]: (m.get("title") or "Untitled Meeting")
            for m in meetings_result.data
        }

        query = (
            self.supabase.table("tasks")
            .select("*")
            .in_("meeting_id", meeting_ids)
            .order("created_at", desc=True)
        )
        if unprocessed_only:
            query = query.is_("github_issue_url", "null")

        result = await query.execute()

        for task in result.data:
            task["meeting_title"] = meeting_titles.get(
                task.get("meeting_id", ""), "Untitled Meeting"
            )

        return result.data

    async def extract_tasks(self, meeting_id: str, user_id: str) -> list[dict]:
        """
        Use the LLM to extract action items from the meeting summary,
        persist them to the tasks table, and return the saved records.
        """
        meeting = await self._get_meeting(meeting_id, user_id)

        summary: str | None = meeting.get("summary")
        if not summary or not summary.strip():
            raise HTTPException(
                status_code=400,
                detail="No summary available. Generate a summary first.",
            )

        # Call LLM (non-streaming — we need the full JSON before we can parse it)
        messages = build_task_extraction_messages(summary)
        provider = LLMProviderFactory.get(
            provider_name=self.settings.default_llm_provider,
            api_key=self._get_api_key(),
        )

        accumulated: list[str] = []
        async for chunk in provider.stream_completion(messages=messages):
            accumulated.append(chunk)

        raw_output = "".join(accumulated)
        raw_tasks = self._parse_tasks(raw_output)

        if not raw_tasks:
            return []

        # Delete existing extracted tasks for this meeting before re-inserting
        await (
            self.supabase.table("tasks").delete().eq("meeting_id", meeting_id).execute()
        )

        rows = [
            {
                "meeting_id": meeting_id,
                "title": t.get("title", "Untitled task"),
                "description": t.get("description"),
                "assignee_name": t.get("assignee_name"),
                "assignee_github": t.get("assignee_github"),
                "priority": t.get("priority", "medium"),
                "status": "extracted",
            }
            for t in raw_tasks
            if isinstance(t, dict)
        ]

        if not rows:
            return []

        result = await self.supabase.table("tasks").insert(rows).execute()
        return result.data

    @staticmethod
    def _parse_tasks(llm_output: str) -> list[dict]:
        """Extract the JSON array from LLM output, tolerating markdown fences."""
        text = llm_output.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()
        try:
            data = json.loads(text)
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return []


async def get_task_extraction_service(
    supabase: AsyncClient = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> TaskExtractionService:
    return TaskExtractionService(supabase, settings)
