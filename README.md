# DelegatorAI

DelegatorAI is a productivity tool that connects your meetings, tasks, and team integrations in one place. It uses AI to turn meeting transcripts into action items and break down high-level goals into concrete subtasks, then pushes everything to GitHub and Slack automatically.

---

## What it does

### Meetings
Send a bot to any Zoom, Google Meet, or Microsoft Teams meeting using Meeting BaaS. Once the meeting ends, retrieve the transcript and generate an AI summary. From the summary, extract action items as structured tasks with titles, descriptions, priorities, and suggested assignees.

### AI Agent Tasks
Describe a goal in plain language. The AI breaks it into subtasks, creates a GitHub issue for each one, and sends a Slack notification per subtask. Progress is streamed in real time so you can watch each step complete. Failed steps can be retried individually from the UI.

### GitHub Integration
Connect your GitHub account via OAuth. Set a default repository. Issues are created automatically during the task pipeline or manually per meeting action item, with optional assignee selection from your repository collaborators.

### Slack Integration
Connect your Slack workspace via OAuth. Set a default channel. Notifications are sent per subtask during the pipeline, or triggered manually for individual meeting tasks. You can also compose and send a one-off Slack message directly from the tasks page.

### History
A chronological log of all meetings and agent tasks with status badges and quick navigation links.

### Summaries
Browse all AI-generated meeting summaries in one place with full-text search and expandable cards.

### Analytics
Usage stats across meetings and tasks.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, TanStack Query |
| Backend | FastAPI (Python), Server-Sent Events for real-time streaming |
| Database | Supabase (Postgres + Auth) |
| AI | OpenAI, Anthropic, or Google Gemini (configurable) |
| Meeting bot | Meeting BaaS |
| Integrations | GitHub OAuth, Slack OAuth |

---

## Project structure

```
apps/
  web/          Next.js frontend
  api/          FastAPI backend
supabase/
  migrations/   Database schema
```

---

## Getting started

1. Copy `.env.example` to `.env` and fill in your keys.
2. Run the backend: `cd apps/api && uvicorn app.main:app --reload`
3. Run the frontend: `cd apps/web && npm install && npm run dev`
4. Open `http://localhost:3000`

Required keys: Supabase, at least one LLM provider (Gemini, OpenAI, or Anthropic), GitHub OAuth app, Slack OAuth app, Meeting BaaS API key.
