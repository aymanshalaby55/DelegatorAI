import asyncio
import json
import logging
import re
from datetime import datetime, timezone

from fastapi import Depends
from supabase import AsyncClient

from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.integrations.manager import IntegrationManager
from app.llm.factory import LLMProviderFactory
from app.services.task_service.prompts import build_task_decomposition_messages

logger = logging.getLogger(__name__)

TABLE = "agent_tasks"

# ---------------------------------------------------------------------------
# Module-level event bus — shared across all TaskService instances so that
# background tasks spawned in one request can deliver events to SSE subscribers
# in a separate request.
# ---------------------------------------------------------------------------
_event_bus: dict[str, list[asyncio.Queue]] = {}


def _publish(task_id: str, event: dict) -> None:
    for queue in _event_bus.get(task_id, []):
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            logger.warning("Queue full for task %s, dropping event", task_id)


def subscribe(task_id: str) -> "asyncio.Queue[dict]":
    queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=256)
    _event_bus.setdefault(task_id, []).append(queue)
    return queue


def unsubscribe(task_id: str, queue: "asyncio.Queue[dict]") -> None:
    subs = _event_bus.get(task_id, [])
    if queue in subs:
        subs.remove(queue)
    if not subs:
        _event_bus.pop(task_id, None)


# ---------------------------------------------------------------------------
# TaskService
# ---------------------------------------------------------------------------


class TaskService:
    def __init__(self, supabase: AsyncClient, settings: Settings) -> None:
        self.supabase = supabase
        self.settings = settings

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _get_api_key(self) -> str | None:
        provider = self.settings.default_llm_provider
        key_map = {
            "gemini": self.settings.gemini_api_key,
            "openai": self.settings.openai_api_key,
            "anthropic": self.settings.anthropic_api_key,
        }
        return key_map.get(provider) or None

    async def _update_task(self, task_id: str, **kwargs) -> None:
        await (
            self.supabase.table(TABLE)
            .update({"updated_at": datetime.now(timezone.utc).isoformat(), **kwargs})
            .eq("id", task_id)
            .execute()
        )

    # ------------------------------------------------------------------
    # Public CRUD
    # ------------------------------------------------------------------

    async def create_task(self, user_id: str, prompt: str) -> str:
        initial_steps = [
            {"name": "LLM Analysis", "status": "pending", "error": None},
            {"name": "GitHub Issues", "status": "pending", "error": None},
            {"name": "Slack Notification", "status": "pending", "error": None},
        ]
        result = await (
            self.supabase.table(TABLE)
            .insert(
                {
                    "user_id": user_id,
                    "prompt": prompt,
                    "status": "pending",
                    "steps": initial_steps,
                    "subtasks": [],
                }
            )
            .execute()
        )
        return result.data[0]["id"]

    async def get_task(self, task_id: str, user_id: str) -> dict | None:
        result = await (
            self.supabase.table(TABLE)
            .select("*")
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def list_tasks(self, user_id: str) -> list[dict]:
        result = await (
            self.supabase.table(TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    # ------------------------------------------------------------------
    # Event bus delegation (thin wrappers around module-level functions)
    # ------------------------------------------------------------------

    def subscribe(self, task_id: str) -> "asyncio.Queue[dict]":
        return subscribe(task_id)

    def unsubscribe(self, task_id: str, queue: "asyncio.Queue[dict]") -> None:
        unsubscribe(task_id, queue)

    # ------------------------------------------------------------------
    # Pipeline
    # ------------------------------------------------------------------

    async def run_pipeline(self, task_id: str, user_id: str, prompt: str) -> None:
        steps = [
            {"name": "LLM Analysis", "status": "pending", "error": None},
            {"name": "GitHub Issues", "status": "pending", "error": None},
            {"name": "Slack Notification", "status": "pending", "error": None},
        ]
        subtasks: list[dict] = []

        await self._update_task(task_id, status="processing", steps=steps)
        _publish(task_id, {"type": "status_update", "status": "processing"})

        # ── Step 1: LLM Analysis ──────────────────────────────────────
        steps[0]["status"] = "processing"
        await self._update_task(task_id, steps=steps)
        _publish(task_id, {"type": "step_update", "steps": steps})

        llm_output = ""
        try:
            messages = build_task_decomposition_messages(prompt)
            provider = LLMProviderFactory.get(
                provider_name=self.settings.default_llm_provider,
                api_key=self._get_api_key(),
            )
            async for chunk in provider.stream_completion(messages=messages):
                llm_output += chunk
                _publish(task_id, {"type": "llm_chunk", "chunk": chunk})

            subtasks = self._parse_subtasks(llm_output)
            steps[0]["status"] = "completed"
            await self._update_task(
                task_id,
                steps=steps,
                llm_output=llm_output,
                subtasks=subtasks,
            )
            _publish(
                task_id,
                {"type": "subtasks_ready", "subtasks": subtasks, "steps": steps},
            )

        except Exception as exc:
            logger.exception("LLM step failed for task %s", task_id)
            steps[0]["status"] = "failed"
            steps[0]["error"] = str(exc)
            await self._update_task(
                task_id, status="failed", steps=steps, error=str(exc)
            )
            _publish(task_id, {"type": "error", "error": str(exc), "steps": steps})
            _publish(task_id, {"type": "done"})
            return

        # ── Step 2: GitHub Issues ─────────────────────────────────────
        steps[1]["status"] = "processing"
        await self._update_task(task_id, steps=steps)
        _publish(task_id, {"type": "step_update", "steps": steps})

        integration_manager = IntegrationManager(self.supabase, self.settings)
        github_any_failed = False

        for i, subtask in enumerate(subtasks):
            try:
                result = await integration_manager.execute_action(
                    user_id=user_id,
                    provider_name="github",
                    action="create_issue",
                    payload={
                        "title": subtask["title"],
                        "body": subtask["description"],
                        "labels": subtask.get("labels", []),
                    },
                )
                subtask["github_issue_number"] = result.get("number")
                subtask["github_issue_url"] = result.get("html_url")
                subtask["github_error"] = None
                subtask["slack_status"] = None
                subtasks[i] = subtask
                _publish(
                    task_id,
                    {"type": "subtask_update", "index": i, "subtask": subtask},
                )
            except Exception as exc:
                logger.warning(
                    "GitHub issue creation failed for subtask %d of task %s: %s",
                    i,
                    task_id,
                    exc,
                )
                subtask["github_error"] = str(exc)
                subtasks[i] = subtask
                github_any_failed = True
                _publish(
                    task_id,
                    {
                        "type": "subtask_update",
                        "index": i,
                        "subtask": subtask,
                        "error": str(exc),
                    },
                )

        steps[1]["status"] = "failed" if github_any_failed else "completed"
        if github_any_failed:
            steps[1]["error"] = "One or more issues failed to create"
        await self._update_task(task_id, steps=steps, subtasks=subtasks)
        _publish(task_id, {"type": "step_update", "steps": steps})

        # ── Step 3: Slack Notification ────────────────────────────────
        steps[2]["status"] = "processing"
        await self._update_task(task_id, steps=steps)
        _publish(task_id, {"type": "step_update", "steps": steps})

        slack_any_failed = False

        for i, subtask in enumerate(subtasks):
            try:
                slack_text = self._build_single_slack_message(subtask)
                await integration_manager.execute_action(
                    user_id=user_id,
                    provider_name="slack",
                    action="post_message",
                    payload={"text": slack_text},
                )
                subtask["slack_status"] = "sent"
                subtask["slack_error"] = None
                subtasks[i] = subtask
                _publish(
                    task_id,
                    {"type": "subtask_update", "index": i, "subtask": subtask},
                )
            except Exception as exc:
                logger.warning(
                    "Slack message failed for subtask %d of task %s: %s",
                    i,
                    task_id,
                    exc,
                )
                subtask["slack_status"] = "failed"
                subtask["slack_error"] = str(exc)
                subtasks[i] = subtask
                slack_any_failed = True
                _publish(
                    task_id,
                    {
                        "type": "subtask_update",
                        "index": i,
                        "subtask": subtask,
                        "error": str(exc),
                    },
                )

        steps[2]["status"] = "failed" if slack_any_failed else "completed"
        if slack_any_failed:
            steps[2]["error"] = "One or more Slack messages failed to send"
        await self._update_task(task_id, steps=steps, subtasks=subtasks)
        _publish(task_id, {"type": "step_update", "steps": steps})

        # ── Finalize ──────────────────────────────────────────────────
        await self._update_task(task_id, status="completed", subtasks=subtasks)
        _publish(
            task_id,
            {
                "type": "completed",
                "status": "completed",
                "steps": steps,
                "subtasks": subtasks,
            },
        )
        _publish(task_id, {"type": "done"})

    # ------------------------------------------------------------------
    # Manual actions
    # ------------------------------------------------------------------

    async def notify_slack_subtask(
        self, task_id: str, user_id: str, subtask_index: int
    ) -> dict:
        task = await self.get_task(task_id, user_id)
        if not task:
            raise ValueError("Task not found")
        subtasks: list[dict] = task.get("subtasks", [])
        if subtask_index < 0 or subtask_index >= len(subtasks):
            raise ValueError(f"Subtask index {subtask_index} out of range")

        subtask = subtasks[subtask_index]
        integration_manager = IntegrationManager(self.supabase, self.settings)

        slack_text = self._build_single_slack_message(subtask)
        await integration_manager.execute_action(
            user_id=user_id,
            provider_name="slack",
            action="post_message",
            payload={"text": slack_text},
        )

        subtask["slack_status"] = "sent"
        subtask["slack_error"] = None
        subtasks[subtask_index] = subtask
        await self._update_task(task_id, subtasks=subtasks)
        return subtask

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_subtasks(llm_output: str) -> list[dict]:
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

    @staticmethod
    def _build_single_slack_message(subtask: dict) -> str:
        lines = [f"*{subtask['title']}*", subtask["description"]]
        if subtask.get("github_issue_url"):
            lines.append(
                f"<{subtask['github_issue_url']}|"
                f"GitHub Issue #{subtask.get('github_issue_number')}>"
            )
        return "\n".join(lines)


async def get_task_service(
    supabase: AsyncClient = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> TaskService:
    return TaskService(supabase, settings)
