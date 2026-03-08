import { createClient } from "@/lib/supabase/client";
import apiClient from "@/lib/api";
import { handleApiError } from "@/types/apiError";
import type { ApiResponse } from "@/types/apiResponse";
import type {
  Meeting,
  JoinMeetingRequest,
  SummaryFormat,
  SummaryLength,
} from "@/types/meeting";

async function parseResponse<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<ApiResponse<T>> {
  const response = await promise;
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data;
}

export async function getMeetings(): Promise<ApiResponse<Meeting[]>> {
  try {
    return await parseResponse(apiClient.get("/meetings/"));
  } catch (error) {
    handleApiError(error);
  }
}

export async function joinMeeting(
  data: JoinMeetingRequest,
): Promise<ApiResponse<Meeting>> {
  try {
    return await parseResponse(apiClient.post("/meetings/join", data));
  } catch (error) {
    handleApiError(error);
  }
}

export async function leaveMeeting(
  meetingId: string,
): Promise<ApiResponse<null>> {
  try {
    return await parseResponse(apiClient.post(`/meetings/${meetingId}/leave`));
  } catch (error) {
    handleApiError(error);
  }
}

export async function getMeetingById(
  meetingId: string,
): Promise<ApiResponse<Meeting>> {
  try {
    return await parseResponse(apiClient.get(`/meetings/${meetingId}`));
  } catch (error) {
    handleApiError(error);
  }
}

export async function getMeetingTranscript(
  meetingId: string,
): Promise<ApiResponse<unknown>> {
  try {
    return await parseResponse(
      apiClient.get(`/meetings/${meetingId}/transcript`),
    );
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Streams summary generation chunks from the API.
 * Yields raw text chunks as they arrive.
 * Uses native fetch so we can read the streaming body directly.
 */
export async function* streamGenerateSummary(
  meetingId: string,
  length: SummaryLength,
  format: SummaryFormat,
): AsyncGenerator<string, void, unknown> {
  const supabase = createClient();

  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const response = await fetch(
    `${baseUrl}/meetings/${meetingId}/summary/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ length, format }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to generate summary: ${response.status} ${errorText}`,
    );
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}
