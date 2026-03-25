"use client";

import { motion } from "framer-motion";
import {
  CheckSquare,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskForm } from "@/components/tasks/TaskForm";
import { SlackMessageForm } from "@/components/tasks/SlackMessageForm";
import { TaskCard } from "@/components/tasks/TaskCard";
import { AgentTaskSkeleton } from "@/components/tasks/AgentTaskSkeleton";
import { MeetingTaskSkeleton } from "@/components/tasks/MeetingTaskSkeleton";
import { SectionHeader } from "@/components/tasks/SectionHeader";
import { MeetingTaskRow } from "@/components/tasks/MeetingTaskRow";
import { useTasks, useCreateAndStreamTask } from "@/hooks/useTasks";
import { useAllMeetingTasks } from "@/hooks/useMeeting";
import type { AgentTask } from "@/types/task";
import type { MeetingTask } from "@/types/meeting";

export default function TasksPage() {
  const {
    data: agentTasks = [],
    isLoading: agentLoading,
    isError,
    error,
  } = useTasks();
  const { data: meetingTasks = [], isLoading: meetingLoading } =
    useAllMeetingTasks(false);
  const { submit, activeTaskId, isStreaming, ...streamState } =
    useCreateAndStreamTask();

  // Split agent tasks by status
  const activeTask = agentTasks.find((t: AgentTask) => t.id === activeTaskId);
  const otherTasks = agentTasks.filter((t: AgentTask) => t.id !== activeTaskId);
  const pendingTasks = otherTasks.filter(
    (t: AgentTask) => t.status === "pending",
  );
  const processingTasks = otherTasks.filter(
    (t: AgentTask) => t.status === "processing",
  );
  const doneTasks = otherTasks.filter(
    (t: AgentTask) => t.status === "completed" || t.status === "failed",
  );

  // Split meeting tasks by GitHub status
  const unprocessedMeetingTasks = meetingTasks.filter(
    (t) => !t.github_issue_url,
  );
  const processedMeetingTasks = meetingTasks.filter(
    (t) => !!t.github_issue_url,
  );

  const agentIsEmpty =
    !agentLoading && agentTasks.length === 0 && !activeTaskId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 lg:p-8 w-full"
    >
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <CheckSquare className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Tasks
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Delegate work to the AI agent or push meeting action items to GitHub
          and Slack.
        </p>
      </div>

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── Left: Agent tasks ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              AI Agent Tasks
            </h2>
          </div>

          <TaskForm
            onSubmit={(prompt) => submit(prompt)}
            isLoading={isStreaming}
          />
          <SlackMessageForm />

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load tasks: {error?.message ?? "Unknown error"}
            </div>
          )}

          {activeTaskId && activeTask && (
            <section className="space-y-3">
              <SectionHeader
                icon={Loader2}
                label="Running"
                count={1}
                iconClass="text-primary animate-spin"
              />
              <TaskCard
                task={activeTask}
                streamState={{ ...streamState, isStreaming }}
              />
            </section>
          )}

          {agentLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <AgentTaskSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {pendingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={Clock}
                    label="Queued"
                    count={pendingTasks.length}
                    iconClass="text-yellow-400"
                  />
                  <div className="space-y-4">
                    {pendingTasks.map((t: AgentTask) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                </section>
              )}

              {processingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={Loader2}
                    label="Processing"
                    count={processingTasks.length}
                    iconClass="text-primary"
                  />
                  <div className="space-y-4">
                    {processingTasks.map((t: AgentTask) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                </section>
              )}

              {doneTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={
                      doneTasks.some((t) => t.status === "failed")
                        ? XCircle
                        : CheckCircle2
                    }
                    label="Recent"
                    count={doneTasks.length}
                    iconClass="text-green-500"
                  />
                  <div className="space-y-4">
                    {doneTasks.map((t: AgentTask) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                </section>
              )}

              {agentIsEmpty && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center glass rounded-2xl">
                  <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-sm">
                      No agent tasks yet
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[240px]">
                      Describe a goal above and the AI will break it into
                      subtasks.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right: Meeting tasks ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-violet-400" />
            <h2 className="text-sm font-semibold text-foreground">
              Meeting Action Items
            </h2>
            {!meetingLoading && meetingTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs rounded-full">
                {meetingTasks.length}
              </Badge>
            )}
          </div>

          {meetingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <MeetingTaskSkeleton key={i} />
              ))}
            </div>
          ) : meetingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center glass rounded-2xl">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-violet-400" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-sm">
                  No meeting tasks
                </p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Open a meeting and extract action items — they&apos;ll appear
                  here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {unprocessedMeetingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={AlertCircle}
                    label="Not pushed to GitHub"
                    count={unprocessedMeetingTasks.length}
                    iconClass="text-yellow-400"
                  />
                  <div className="space-y-3">
                    {unprocessedMeetingTasks.map((t: MeetingTask) => (
                      <MeetingTaskRow key={t.id} task={t} />
                    ))}
                  </div>
                </section>
              )}

              {processedMeetingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={CheckCircle2}
                    label="Pushed to GitHub"
                    count={processedMeetingTasks.length}
                    iconClass="text-green-500"
                  />
                  <div className="space-y-3">
                    {processedMeetingTasks.map((t: MeetingTask) => (
                      <MeetingTaskRow key={t.id} task={t} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
