// hooks/use-meetings.ts
"use client";

import { useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getMeetings,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  getMeetingTranscript,
  streamGenerateSummary,
  getMeetingTasks,
  extractMeetingTasks,
  pushTaskToGitHub,
  notifySlack,
  getAllMeetingTasks,
} from "@/services/meeting-service";
import type {
  MeetingTask,
  JoinMeetingRequest,
  SummaryFormat,
  SummaryLength,
} from "@/types/meeting";

export const meetingKeys = {
  all: ["meetings"] as const,
  byId: (id: string) => ["meetings", id] as const,
  transcript: (id: string) => ["meetings", id, "transcript"] as const,
  tasks: (id: string) => ["meetings", id, "tasks"] as const,
  allTasks: (unprocessed: boolean) => ["meetings", "tasks", "all", unprocessed] as const,
};

export function useMeetings() {
  return useQuery({
    queryKey: meetingKeys.all,
    queryFn: getMeetings,
    select: (res) => res.data,
  });
}

export function useMeeting(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.byId(meetingId),
    queryFn: () => getMeetingById(meetingId),
    select: (res) => res.data,
    enabled: !!meetingId,
  });
}

export function useJoinMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: JoinMeetingRequest) => joinMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      toast.success("Joined meeting successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to join meeting");
    },
  });
}

export function useLeaveMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => leaveMeeting(meetingId),
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      queryClient.invalidateQueries({ queryKey: meetingKeys.byId(meetingId) });
      toast.success("Left meeting successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to leave meeting");
    },
  });
}

export function useMeetingTranscript(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.transcript(meetingId),
    queryFn: () => getMeetingTranscript(meetingId),
    select: (res) => res.data,
    enabled: !!meetingId,
  });
}

export function useGenerateSummary(meetingId: string) {
  const queryClient = useQueryClient();
  const [streamedText, setStreamedText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (length: SummaryLength, format: SummaryFormat) => {
      // Cancel any previous in-flight stream
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setStreamedText("");
      setError(null);
      setIsStreaming(true);

      try {
        for await (const chunk of streamGenerateSummary(
          meetingId,
          length,
          format,
        )) {
          setStreamedText((prev) => prev + chunk);
        }
        // Refresh the meeting data so meeting.summary is updated
        queryClient.invalidateQueries({
          queryKey: meetingKeys.byId(meetingId),
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          const message =
            err instanceof Error ? err.message : "Failed to generate summary";
          setError(message);
          toast.error(message);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [meetingId, queryClient],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStreamedText("");
    setError(null);
    setIsStreaming(false);
  }, []);

  return { generate, reset, streamedText, isStreaming, error };
}

export function useMeetingTasks(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.tasks(meetingId),
    queryFn: () => getMeetingTasks(meetingId),
    select: (res) => res.data as MeetingTask[],
    enabled: !!meetingId,
  });
}

export function useExtractTasks(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => extractMeetingTasks(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.tasks(meetingId) });
      toast.success("Tasks extracted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to extract tasks");
    },
  });
}

export function usePushToGitHub(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assignees }: { taskId: string; assignees?: string[] }) =>
      pushTaskToGitHub(meetingId, taskId, assignees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.tasks(meetingId) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.allTasks(false) });
      toast.success("GitHub issue created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create GitHub issue");
    },
  });
}

export function useAllMeetingTasks(unprocessed = false) {
  return useQuery({
    queryKey: meetingKeys.allTasks(unprocessed),
    queryFn: () => getAllMeetingTasks(unprocessed),
    select: (res) => res.data as MeetingTask[],
  });
}

export function useNotifySlack(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskIds?: string[]) => notifySlack(meetingId, taskIds),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.tasks(meetingId) });
      const count = (res?.data as { notified_count?: number })?.notified_count ?? 0;
      toast.success(`Slack notification sent for ${count} task${count !== 1 ? "s" : ""}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send Slack notification");
    },
  });
}
