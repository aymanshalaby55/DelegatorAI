import { createClient } from "@/lib/supabase/client";
import apiClient from "@/lib/api";
import { handleApiError } from "@/types/apiError";
import type { ApiResponse } from "@/types/apiResponse";
import type { AgentTask, CreateTaskRequest, TaskSSEEvent } from "@/types/task";

async function parseResponse<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<ApiResponse<T>> {
  const response = await promise;
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data;
}

export async function createTask(
  prompt: string,
): Promise<ApiResponse<{ task_id: string }>> {
  try {
    const body: CreateTaskRequest = { prompt };
    return await parseResponse(apiClient.post("/tasks/", body));
  } catch (error) {
    handleApiError(error);
  }
}

export async function getTasks(): Promise<ApiResponse<AgentTask[]>> {
  try {
    return await parseResponse(apiClient.get("/tasks/"));
  } catch (error) {
    handleApiError(error);
  }
}

export async function getTask(taskId: string): Promise<ApiResponse<AgentTask>> {
  try {
    return await parseResponse(apiClient.get(`/tasks/${taskId}`));
  } catch (error) {
    handleApiError(error);
  }
}

export async function notifySlackSubtask(
  taskId: string,
  subtaskIndex: number,
): Promise<ApiResponse<unknown>> {
  try {
    return await parseResponse(
      apiClient.post(`/tasks/${taskId}/subtasks/${subtaskIndex}/notify-slack`),
    );
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Streams SSE events for a task pipeline.
 * Yields parsed TaskSSEEvent objects as they arrive.
 */
export async function* streamTaskProgress(
  taskId: string,
): AsyncGenerator<TaskSSEEvent, void, unknown> {
  const supabase = createClient();

  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const response = await fetch(`${baseUrl}/tasks/${taskId}/stream`, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to stream task ${taskId}: ${response.status} ${errorText}`,
    );
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr) as TaskSSEEvent;
            yield event;
            if (event.type === "done") return;
          } catch {
            // Malformed JSON — skip
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
