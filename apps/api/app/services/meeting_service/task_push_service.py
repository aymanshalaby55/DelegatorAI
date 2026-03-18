import logging
from datetime import datetime, timezone

from fastapi import Depends, HTTPException
from supabase import AsyncClient

from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.integrations.manager import IntegrationManager
from app.integrations.providers.slack_provider import SlackProvider
from app.services.token_service import TokenService

logger = logging.getLogger(__name__)


class TaskPushService:
    def __init__(self, supabase: AsyncClient, settings: Settings) -> None:
        self.supabase = supabase
        self.settings = settings

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_task_with_ownership(self, task_id: str, user_id: str) -> dict:
        """Fetch a task and verify the owning meeting belongs to user_id."""
        result = await (
            self.supabase.table("tasks")
            .select("*, meetings!inner(user_id)")
            .eq("id", task_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Task not found")
        task = result.data[0]
        meeting_user = task.get("meetings", {}).get("user_id")
        if meeting_user != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        return task

    async def _get_tasks_for_meeting(
        self, meeting_id: str, user_id: str, task_ids: list[str] | None = None
    ) -> list[dict]:
        """Fetch tasks for a meeting, optionally filtered by task_ids."""
        meeting_check = await (
            self.supabase.table("meetings")
            .select("id")
            .eq("id", meeting_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not meeting_check.data:
            raise HTTPException(status_code=404, detail="Meeting not found")

        query = self.supabase.table("tasks").select("*").eq("meeting_id", meeting_id)
        if task_ids:
            query = query.in_("id", task_ids)

        result = await query.execute()
        return result.data or []

    async def _update_task(self, task_id: str, **kwargs) -> dict:
        result = await (
            self.supabase.table("tasks")
            .update({"updated_at": datetime.now(timezone.utc).isoformat(), **kwargs})
            .eq("id", task_id)
            .execute()
        )
        return result.data[0] if result.data else {}

    # ------------------------------------------------------------------
    # Push a single task to GitHub
    # ------------------------------------------------------------------

    async def push_to_github(
        self,
        task_id: str,
        user_id: str,
        assignees_override: list[str] | None = None,
    ) -> dict:
        """
        Create a GitHub issue for the given task and update the task record
        with the issue URL, number, and status = 'in_progress'.

        If assignees_override is provided, those GitHub usernames are used instead
        of the task's assignee_github field.
        """
        task = await self._get_task_with_ownership(task_id, user_id)

        if task.get("github_issue_url"):
            raise HTTPException(
                status_code=409,
                detail="A GitHub issue already exists for this task.",
            )

        manager = IntegrationManager(self.supabase, self.settings)

        if assignees_override is not None:
            assignees = [a for a in assignees_override if a]
        elif task.get("assignee_github"):
            assignees = [task["assignee_github"]]
        else:
            assignees = []

        try:
            result = await manager.execute_action(
                user_id=user_id,
                provider_name="github",
                action="create_issue",
                payload={
                    "title": task["title"],
                    "body": self._build_github_body(task),
                    "labels": [task.get("priority", "medium")],
                    "assignees": assignees,
                },
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        updated = await self._update_task(
            task_id,
            github_issue_url=result.get("html_url"),
            github_issue_number=result.get("number"),
            status="in_progress",
        )
        return updated

    # ------------------------------------------------------------------
    # Notify Slack about one or more tasks
    # ------------------------------------------------------------------

    async def notify_slack(
        self,
        meeting_id: str,
        user_id: str,
        task_ids: list[str] | None = None,
    ) -> dict:
        """
        Post a formatted Slack message listing the requested tasks.
        If task_ids is empty/None, all tasks for the meeting are included.
        Resolves assignee names to Slack mentions where possible.
        """
        tasks = await self._get_tasks_for_meeting(meeting_id, user_id, task_ids)
        if not tasks:
            raise HTTPException(status_code=400, detail="No tasks found to notify.")

        manager = IntegrationManager(self.supabase, self.settings)

        # Resolve Slack mention strings for each task's assignee
        token_service = TokenService(self.supabase)
        integration_record = await token_service.get(user_id, "slack")
        if not integration_record:
            raise HTTPException(
                status_code=400,
                detail="Slack integration not connected.",
            )
        slack_token = integration_record["access_token"]

        slack_provider = SlackProvider(self.settings)
        mention_cache: dict[str, str] = {}

        async def resolve_mention(name: str | None, github: str | None) -> str | None:
            if not name and not github:
                return None
            key = github or name
            if key not in mention_cache:
                mention_cache[key] = await slack_provider.lookup_slack_user(
                    slack_token, key
                )
            return mention_cache[key]

        # Build Slack blocks
        blocks, fallback_lines = await self._build_slack_blocks(tasks, resolve_mention)

        try:
            result = await manager.execute_action(
                user_id=user_id,
                provider_name="slack",
                action="post_message",
                payload={
                    "text": "\n".join(fallback_lines),
                    "blocks": blocks,
                },
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Mark all tasks as slack_notified
        now_iso = datetime.now(timezone.utc).isoformat()
        for task in tasks:
            await self._update_task(task["id"], slack_notified_at=now_iso)

        return {"notified_count": len(tasks), "slack_ts": result.get("ts")}

    # ------------------------------------------------------------------
    # Message builders
    # ------------------------------------------------------------------

    @staticmethod
    def _build_github_body(task: dict) -> str:
        lines = []
        if task.get("description"):
            lines.append(task["description"])
            lines.append("")
        if task.get("assignee_name"):
            lines.append(f"**Assignee:** {task['assignee_name']}")
        if task.get("assignee_github"):
            lines.append(f"**GitHub:** @{task['assignee_github']}")
        lines.append(f"**Priority:** {task.get('priority', 'medium').capitalize()}")
        return "\n".join(lines)

    @staticmethod
    async def _build_slack_blocks(
        tasks: list[dict],
        resolve_mention,
    ) -> tuple[list[dict], list[str]]:
        priority_emoji = {
            "high": ":red_circle:",
            "medium": ":large_yellow_circle:",
            "low": ":large_green_circle:",
        }

        blocks: list[dict] = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f":clipboard: Task Update — {len(tasks)} action item{'s' if len(tasks) != 1 else ''}",
                },
            },
            {"type": "divider"},
        ]
        fallback_lines = [f"Task Update — {len(tasks)} action items:"]

        for task in tasks:
            mention = await resolve_mention(
                task.get("assignee_name"), task.get("assignee_github")
            )
            priority = task.get("priority", "medium")
            emoji = priority_emoji.get(priority, ":white_circle:")

            # Build the section text
            text_parts = [f"{emoji} *{task['title']}*"]
            if task.get("description"):
                text_parts.append(f">{task['description']}")
            if mention:
                text_parts.append(f"Assignee: {mention}")
            if task.get("github_issue_url"):
                text_parts.append(
                    f"<{task['github_issue_url']}|GitHub Issue #{task.get('github_issue_number', '')}>"
                )

            blocks.append(
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "\n".join(text_parts),
                    },
                }
            )

            # Fallback plain text
            fallback = f"• {task['title']} [{priority}]"
            if task.get("assignee_name"):
                fallback += f" — {task['assignee_name']}"
            if task.get("github_issue_url"):
                fallback += f" {task['github_issue_url']}"
            fallback_lines.append(fallback)

        blocks.append({"type": "divider"})
        return blocks, fallback_lines


async def get_task_push_service(
    supabase: AsyncClient = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> TaskPushService:
    return TaskPushService(supabase, settings)
