export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  meeting_url: string;
  platform: string;
  status: "joining" | "in_progress" | "completed" | "failed";
  transcript: string | null;
  summary: string | null;
  bot_id: string;
  created_at: string;
  updated_at: string;
  provider: string;
}

export type JoinMeetingRequest = {
  meeting_url: string;
  title?: string;
};

export type MeetingResponse = {
  meeting: Meeting;
};

export type MeetingStatus = "completed" | "in_progress" | "pending" | "failed";

export type SummaryLength = "short" | "medium" | "detailed";
export type SummaryFormat = "bullets" | "paragraph";

export interface TranscriptLine {
  speaker: string | null;
  text: string;
  raw: string;
}

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "extracted" | "in_progress" | "done";

export interface MeetingTask {
  id: string;
  meeting_id: string;
  meeting_title?: string;
  title: string;
  description: string | null;
  assignee_name: string | null;
  assignee_github: string | null;
  status: TaskStatus;
  github_issue_url: string | null;
  github_issue_number: number | null;
  slack_notified_at: string | null;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
}
