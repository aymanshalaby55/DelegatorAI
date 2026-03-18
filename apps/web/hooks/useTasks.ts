"use client";

import { useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { createTask, getTasks, getTask, streamTaskProgress } from "@/services/task-service";
import type { AgentTask, TaskStep, Subtask } from "@/types/task";

export const taskKeys = {
  all: ["agent_tasks"] as const,
  byId: (id: string) => ["agent_tasks", id] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: getTasks,
    select: (res) => res.data as AgentTask[],
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.byId(taskId),
    queryFn: () => getTask(taskId),
    select: (res) => res.data as AgentTask,
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) => createTask(prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

export interface TaskStreamState {
  steps: TaskStep[];
  subtasks: Subtask[];
  llmOutput: string;
  progress: number;
  isStreaming: boolean;
  error: string | null;
}

const INITIAL_STEPS: TaskStep[] = [
  { name: "LLM Analysis", status: "pending", error: null },
  { name: "GitHub Issues", status: "pending", error: null },
  { name: "Slack Notification", status: "pending", error: null },
];

function stepsToProgress(steps: TaskStep[]): number {
  const completed = steps.filter((s) => s.status === "completed").length;
  return Math.round((completed / steps.length) * 100);
}

export function useTaskStream(_taskId: string | null) {
  const queryClient = useQueryClient();

  const [state, setState] = useState<TaskStreamState>({
    steps: INITIAL_STEPS,
    subtasks: [],
    llmOutput: "",
    progress: 0,
    isStreaming: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (id: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState({
        steps: INITIAL_STEPS,
        subtasks: [],
        llmOutput: "",
        progress: 0,
        isStreaming: true,
        error: null,
      });

      try {
        for await (const event of streamTaskProgress(id)) {
          if (abortRef.current?.signal.aborted) break;

          switch (event.type) {
            case "step_update":
              setState((prev) => ({
                ...prev,
                steps: event.steps,
                progress: stepsToProgress(event.steps),
              }));
              break;

            case "llm_chunk":
              setState((prev) => ({
                ...prev,
                llmOutput: prev.llmOutput + event.chunk,
              }));
              break;

            case "subtasks_ready":
              setState((prev) => ({
                ...prev,
                subtasks: event.subtasks,
                steps: event.steps,
                progress: stepsToProgress(event.steps),
              }));
              break;

            case "subtask_update":
              setState((prev) => {
                const updated = [...prev.subtasks];
                updated[event.index] = event.subtask;
                return { ...prev, subtasks: updated };
              });
              break;

            case "completed":
              setState((prev) => ({
                ...prev,
                steps: event.steps,
                subtasks: event.subtasks,
                progress: 100,
              }));
              queryClient.invalidateQueries({ queryKey: taskKeys.all });
              queryClient.invalidateQueries({ queryKey: taskKeys.byId(id) });
              break;

            case "error":
              setState((prev) => ({
                ...prev,
                steps: event.steps,
                error: event.error,
              }));
              break;

            case "done":
              break;
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          const message =
            err instanceof Error ? err.message : "Stream failed";
          setState((prev) => ({ ...prev, error: message }));
          toast.error(message);
        }
      } finally {
        setState((prev) => ({ ...prev, isStreaming: false }));
      }
    },
    [queryClient],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      steps: INITIAL_STEPS,
      subtasks: [],
      llmOutput: "",
      progress: 0,
      isStreaming: false,
      error: null,
    });
  }, []);

  return { ...state, startStream, reset };
}

/**
 * Combined hook: creates a task and immediately starts streaming its progress.
 * Returns both the mutation and the live stream state.
 */
export function useCreateAndStreamTask() {
  const queryClient = useQueryClient();
  const stream = useTaskStream(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const submit = useCallback(
    async (prompt: string) => {
      try {
        const res = await createTask(prompt);
        const taskId = (res.data as { task_id: string }).task_id;
        setActiveTaskId(taskId);
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        // Start streaming immediately
        stream.startStream(taskId);
        return taskId;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create task";
        toast.error(message);
        return null;
      }
    },
    [queryClient, stream],
  );

  return { submit, activeTaskId, ...stream };
}
