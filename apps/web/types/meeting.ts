export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  meeting_url: string;
  platform: string;
  status: "JOINING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
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

export type MeetingStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING" | "FAILED";

export type SummaryLength = "short" | "medium" | "detailed";
export type SummaryFormat = "bullets" | "paragraph";

export interface TranscriptLine {
  speaker: string | null;
  text: string;
  raw: string;
}
