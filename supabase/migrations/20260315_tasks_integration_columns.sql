-- Migration: add integration tracking columns to tasks table
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS github_issue_number integer,
  ADD COLUMN IF NOT EXISTS slack_notified_at timestamptz;
