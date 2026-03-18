-- Migration: create agent_tasks table for background task processing
-- Note: A "tasks" table already exists for meeting-extracted tasks.
-- This new table is for the AI background task pipeline.

CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  user_id     uuid        NOT NULL,
  prompt      text        NOT NULL,
  status      text        NOT NULL DEFAULT 'pending',
  steps       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  subtasks    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  llm_output  text,
  error       text,
  created_at  timestamptz          DEFAULT now(),
  updated_at  timestamptz          DEFAULT now(),
  CONSTRAINT agent_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT agent_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent tasks"
  ON public.agent_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent tasks"
  ON public.agent_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent tasks"
  ON public.agent_tasks FOR UPDATE
  USING (auth.uid() = user_id);
