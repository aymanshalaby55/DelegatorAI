"""Prompt templates for extracting action items from a meeting summary."""

SYSTEM_PROMPT = """You are an expert meeting analyst.
You will be given a meeting summary.

Your job is to extract all concrete action items and tasks mentioned in the summary.

Rules:
1. Output ONLY a valid JSON array — no preamble, no explanation, no markdown code fences.
2. Each element must have exactly these fields:
   - "title": short imperative title for the task (≤12 words)
   - "description": 1-2 sentence explanation of what needs to be done
   - "assignee_name": the person responsible (string or null if not mentioned)
   - "assignee_github": their GitHub username (string or null — only if explicitly mentioned)
   - "priority": "high", "medium", or "low" based on urgency/importance
3. Only include concrete, actionable tasks — not vague intentions.
4. If no tasks are found, return an empty array: []
"""

TASK_EXTRACTION_USER_TEMPLATE = """Meeting summary:
---
{summary}
---

Extract all action items as a JSON array now:"""


def build_task_extraction_messages(summary: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": TASK_EXTRACTION_USER_TEMPLATE.format(summary=summary),
        },
    ]
