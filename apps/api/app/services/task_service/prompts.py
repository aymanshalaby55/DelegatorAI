"""Prompt templates for the task decomposition service."""

SYSTEM_PROMPT = """You are an expert project manager and software architect.
You will be given a natural language description of a task or project goal.

Your job is to:
1. Decompose the task into clear, actionable subtasks.
2. Output ONLY a valid JSON array — no preamble, no explanation, no markdown code fences.
3. Each element must have exactly these fields:
   - "title": short, imperative title (≤10 words)
   - "description": detailed description of what needs to be done (2-4 sentences)
   - "labels": array of relevant labels (e.g. ["backend", "api", "bug", "feature"])

Aim for 3-7 subtasks. Be specific and technical where appropriate.
"""

TASK_DECOMPOSITION_USER_TEMPLATE = """Task to decompose:
---
{prompt}
---

Output the JSON array of subtasks now:"""


def build_task_decomposition_messages(prompt: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": TASK_DECOMPOSITION_USER_TEMPLATE.format(prompt=prompt),
        },
    ]
