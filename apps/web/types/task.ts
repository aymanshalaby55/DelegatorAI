export type TaskStatus = "pending" | "processing" | "completed" | "failed";
export type StepStatus = "pending" | "processing" | "completed" | "failed";

export interface TaskStep {
  name: string;
  status: StepStatus;
  error: string | null;
}

export interface Subtask {
  title: string;
  description: string;
  labels: string[];
  github_issue_number: number | null;
  github_issue_url: string | null;
  github_error: string | null;
  slack_status: string | null;
  slack_error: string | null;
}

export interface AgentTask {
  id: string;
  user_id: string;
  prompt: string;
  status: TaskStatus;
  steps: TaskStep[];
  subtasks: Subtask[];
  llm_output: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  prompt: string;
}

// ---------------------------------------------------------------------------
// SSE event discriminated union
// ---------------------------------------------------------------------------

export interface StatusUpdateEvent {
  type: "status_update";
  status: TaskStatus;
}

export interface StepUpdateEvent {
  type: "step_update";
  steps: TaskStep[];
}

export interface LlmChunkEvent {
  type: "llm_chunk";
  chunk: string;
}

export interface SubtasksReadyEvent {
  type: "subtasks_ready";
  subtasks: Subtask[];
  steps: TaskStep[];
}

export interface SubtaskUpdateEvent {
  type: "subtask_update";
  index: number;
  subtask: Subtask;
  error?: string;
}

export interface CompletedEvent {
  type: "completed";
  status: TaskStatus;
  steps: TaskStep[];
  subtasks: Subtask[];
}

export interface ErrorEvent {
  type: "error";
  error: string;
  steps: TaskStep[];
}

export interface DoneEvent {
  type: "done";
}

export type TaskSSEEvent =
  | StatusUpdateEvent
  | StepUpdateEvent
  | LlmChunkEvent
  | SubtasksReadyEvent
  | SubtaskUpdateEvent
  | CompletedEvent
  | ErrorEvent
  | DoneEvent;
