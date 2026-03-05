import apiClient from "@/lib/api";
import { handleApiError } from "@/types/apiError";
import type { ApiResponse } from "@/types/apiResponse";
import type { Meeting, JoinMeetingRequest } from "@/types/meeting";

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
