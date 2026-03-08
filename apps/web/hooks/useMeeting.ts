// hooks/use-meetings.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getMeetings,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  getMeetingTranscript,
} from "@/services/meeting-service";
import type { JoinMeetingRequest } from "@/types/meeting";

export const meetingKeys = {
  all: ["meetings"] as const,
  byId: (id: string) => ["meetings", id] as const,
  transcript: (id: string) => ["meetings", id, "transcript"] as const,
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
