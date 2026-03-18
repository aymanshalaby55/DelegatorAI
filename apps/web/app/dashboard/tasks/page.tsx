"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Github,
  MessageSquare,
  AlertCircle,
  User,
  ArrowUpRight,
  Flag,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useTasks, useCreateAndStreamTask } from "@/hooks/useTasks";
import { useAllMeetingTasks } from "@/hooks/useMeeting";
import type { AgentTask } from "@/types/task";
import type { MeetingTask } from "@/types/meeting";

// ─── helpers ────────────────────────────────────────────────────────────────

const priorityStyle: Record<string, { color: string; label: string }> = {
  high:   { color: "text-red-400 border-red-400/30 bg-red-400/10",    label: "High"   },
  medium: { color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", label: "Medium" },
  low:    { color: "text-green-400 border-green-400/30 bg-green-400/10",  label: "Low"    },
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AgentTaskSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MeetingTaskSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ElementType;
  label: string;
  count: number;
  iconClass: string;
}

function SectionHeader({ icon: Icon, label, count, iconClass }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${iconClass}`} />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <Badge variant="secondary" className="text-xs h-5 px-1.5 rounded-full">
        {count}
      </Badge>
    </div>
  );
}

// ─── Meeting task row ────────────────────────────────────────────────────────

function MeetingTaskRow({ task }: { task: MeetingTask }) {
  const router = useRouter();
  const prio = priorityStyle[task.priority] ?? priorityStyle.medium;

  return (
    <div className="glass rounded-xl p-4 space-y-2.5 hover:bg-muted/20 transition-colors">
      {/* Title + badges */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium text-foreground leading-snug flex-1 min-w-0">
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <Badge variant="outline" className={`text-xs h-5 px-1.5 ${prio.color}`}>
            <Flag className="h-2.5 w-2.5 mr-1" />
            {prio.label}
          </Badge>
          {task.github_issue_url ? (
            <a
              href={task.github_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Github className="h-3 w-3" />
              #{task.github_issue_number}
            </a>
          ) : (
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-muted-foreground border-border">
              <Github className="h-2.5 w-2.5 mr-1" />
              Not pushed
            </Badge>
          )}
          {task.slack_notified_at && (
            <Badge
              variant="outline"
              className="text-xs h-5 px-1.5 border-green-500/30 text-green-400 bg-green-500/10"
            >
              <MessageSquare className="h-2.5 w-2.5 mr-1" />
              Slack
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: assignee + meeting link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {task.assignee_name && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {task.assignee_name}
            </span>
          )}
        </div>
        {task.meeting_title && (
          <button
            onClick={() => router.push(`/dashboard/meetings/${task.meeting_id}`)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {task.meeting_title}
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { data: agentTasks = [], isLoading: agentLoading, isError, error } = useTasks();
  const { data: meetingTasks = [], isLoading: meetingLoading } = useAllMeetingTasks(false);
  const { submit, activeTaskId, isStreaming, ...streamState } = useCreateAndStreamTask();

  async function handleSubmit(prompt: string) {
    await submit(prompt);
  }

  // Split agent tasks
  const activeTask      = agentTasks.find((t: AgentTask) => t.id === activeTaskId);
  const otherTasks      = agentTasks.filter((t: AgentTask) => t.id !== activeTaskId);
  const pendingTasks    = otherTasks.filter((t: AgentTask) => t.status === "pending");
  const processingTasks = otherTasks.filter((t: AgentTask) => t.status === "processing");
  const doneTasks       = otherTasks.filter(
    (t: AgentTask) => t.status === "completed" || t.status === "failed",
  );

  // Split meeting tasks
  const unprocessedMeetingTasks = meetingTasks.filter((t) => !t.github_issue_url);
  const processedMeetingTasks   = meetingTasks.filter((t) => !!t.github_issue_url);

  const agentIsEmpty = !agentLoading && agentTasks.length === 0 && !activeTaskId;

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
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Tasks</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Delegate work to the AI agent or push meeting action items to GitHub and Slack.
        </p>
      </div>

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

        {/* ── Left: Agent tasks ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold text-foreground">AI Agent Tasks</h2>
          </div>

          <TaskForm onSubmit={handleSubmit} isLoading={isStreaming} />

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load tasks: {error?.message ?? "Unknown error"}
            </div>
          )}

          {activeTaskId && activeTask && (
            <section className="space-y-3">
              <SectionHeader icon={Loader2} label="Running" count={1} iconClass="text-primary animate-spin" />
              <TaskCard task={activeTask} streamState={{ ...streamState, isStreaming }} />
            </section>
          )}

          {agentLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => <AgentTaskSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {pendingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader icon={Clock} label="Queued" count={pendingTasks.length} iconClass="text-yellow-400" />
                  <div className="space-y-4">
                    {pendingTasks.map((t: AgentTask) => <TaskCard key={t.id} task={t} />)}
                  </div>
                </section>
              )}

              {processingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader icon={Loader2} label="Processing" count={processingTasks.length} iconClass="text-primary" />
                  <div className="space-y-4">
                    {processingTasks.map((t: AgentTask) => <TaskCard key={t.id} task={t} />)}
                  </div>
                </section>
              )}

              {doneTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={doneTasks.some((t) => t.status === "failed") ? XCircle : CheckCircle2}
                    label="Recent"
                    count={doneTasks.length}
                    iconClass="text-green-500"
                  />
                  <div className="space-y-4">
                    {doneTasks.map((t: AgentTask) => <TaskCard key={t.id} task={t} />)}
                  </div>
                </section>
              )}

              {agentIsEmpty && !activeTaskId && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center glass rounded-2xl">
                  <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-sm">No agent tasks yet</p>
                    <p className="text-xs text-muted-foreground max-w-[240px]">
                      Describe a goal above and the AI will break it into subtasks.
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
            <h2 className="text-sm font-semibold text-foreground">Meeting Action Items</h2>
            {!meetingLoading && meetingTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs rounded-full">
                {meetingTasks.length}
              </Badge>
            )}
          </div>

          {meetingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <MeetingTaskSkeleton key={i} />)}
            </div>
          ) : meetingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center glass rounded-2xl">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-violet-400" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-sm">No meeting tasks</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Open a meeting and extract action items — they'll appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Unprocessed */}
              {unprocessedMeetingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={AlertCircle}
                    label="Not pushed to GitHub"
                    count={unprocessedMeetingTasks.length}
                    iconClass="text-yellow-400"
                  />
                  <div className="space-y-3">
                    {unprocessedMeetingTasks.map((t) => (
                      <MeetingTaskRow key={t.id} task={t} />
                    ))}
                  </div>
                </section>
              )}

              {/* Processed */}
              {processedMeetingTasks.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={CheckCircle2}
                    label="Pushed to GitHub"
                    count={processedMeetingTasks.length}
                    iconClass="text-green-500"
                  />
                  <div className="space-y-3">
                    {processedMeetingTasks.map((t) => (
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
