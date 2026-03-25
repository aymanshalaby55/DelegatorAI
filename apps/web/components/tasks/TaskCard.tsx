"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Github,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNotifySlackSubtask } from "@/hooks/useTasks";
import type { TaskStreamState } from "@/hooks/useTasks";
import type { AgentTask, TaskStep, Subtask } from "@/types/task";

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

interface StepItemProps {
  step: TaskStep;
  index: number;
}

function StepItem({ step }: StepItemProps) {
  const icons = {
    pending: <Circle className="h-4 w-4 text-muted-foreground shrink-0" />,
    processing: (
      <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
    ),
    completed: (
      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
    ),
    failed: <XCircle className="h-4 w-4 text-destructive shrink-0" />,
  };

  const textClass = {
    pending: "text-muted-foreground",
    processing: "text-primary font-medium",
    completed: "text-foreground",
    failed: "text-destructive",
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        {icons[step.status] ?? icons.pending}
        <span className={`text-sm ${textClass[step.status] ?? textClass.pending}`}>
          {step.name}
        </span>
      </div>
      {step.error && (
        <p className="ml-6 text-xs text-destructive">{step.error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subtask card
// ---------------------------------------------------------------------------

interface SubtaskItemProps {
  subtask: Subtask;
  taskId: string;
  subtaskIndex: number;
  isLive: boolean;
}

function SubtaskItem({ subtask, taskId, subtaskIndex, isLive }: SubtaskItemProps) {
  const { mutate: sendSlack, isPending: isSending } = useNotifySlackSubtask(taskId);

  const canSendSlack =
    !isLive && (subtask.slack_status === null || subtask.slack_status === "failed");

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium text-foreground leading-tight">
          {subtask.title}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {subtask.github_issue_url ? (
            <a
              href={subtask.github_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Github className="h-3 w-3" />#{subtask.github_issue_number}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ) : subtask.github_error ? (
            <Badge variant="destructive" className="text-xs py-0 h-5">
              <Github className="h-2.5 w-2.5 mr-1" />
              Failed
            </Badge>
          ) : null}

          {subtask.slack_status === "sent" && (
            <Badge
              variant="outline"
              className="text-xs py-0 h-5 border-green-500/40 text-green-500"
            >
              <MessageSquare className="h-2.5 w-2.5 mr-1" />
              Slack
            </Badge>
          )}
          {subtask.slack_status === "failed" && (
            <Badge variant="destructive" className="text-xs py-0 h-5">
              <MessageSquare className="h-2.5 w-2.5 mr-1" />
              Slack Failed
            </Badge>
          )}

          {canSendSlack && (
            <Button
              size="sm"
              variant="outline"
              className="h-5 px-1.5 text-xs gap-1 border-muted-foreground/30 hover:border-primary/50 hover:text-primary"
              disabled={isSending}
              onClick={() => sendSlack(subtaskIndex)}
            >
              {isSending ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Send className="h-2.5 w-2.5" />
              )}
              {subtask.slack_status === "failed" ? "Retry Slack" : "Send to Slack"}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {subtask.description}
      </p>

      {subtask.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {subtask.labels.map((label) => (
            <Badge
              key={label}
              variant="secondary"
              className="text-xs py-0 h-4 px-1.5"
            >
              {label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskCard — can render from a persisted task OR from live stream state
// ---------------------------------------------------------------------------

interface TaskCardProps {
  task: AgentTask;
  streamState?: TaskStreamState;
}

export function TaskCard({ task, streamState }: TaskCardProps) {
  const steps = streamState?.steps ?? (task.steps as TaskStep[]) ?? [];
  const subtasks =
    streamState?.subtasks ?? (task.subtasks as Subtask[]) ?? [];
  const llmOutput = streamState?.llmOutput ?? task.llm_output ?? "";
  const progress = streamState?.progress ?? computeProgress(steps);
  const isLive = !!streamState?.isStreaming;

  const statusColors: Record<string, string> = {
    pending: "text-muted-foreground border-muted-foreground/30",
    processing: "text-primary border-primary/30",
    completed: "text-green-500 border-green-500/30",
    failed: "text-destructive border-destructive/30",
  };
  const statusColor = statusColors[task.status] ?? statusColors.pending;

  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm text-foreground leading-relaxed flex-1">
          {task.prompt}
        </p>
        <Badge
          variant="outline"
          className={`text-xs shrink-0 capitalize ${statusColor}`}
        >
          {isLive ? "processing" : task.status}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground text-right">{progress}%</p>
      </div>

      {/* Pipeline steps */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pipeline
          </p>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <StepItem key={step.name} step={step} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Streaming LLM output */}
      {llmOutput && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Analysis
          </p>
          <div className="rounded-lg bg-muted/40 p-3 max-h-48 overflow-y-auto">
            <div className="prose prose-invert prose-sm max-w-none text-xs">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {llmOutput}
              </ReactMarkdown>
            </div>
            {isLive && (
              <span className="inline-block w-0.5 h-3 bg-primary align-middle ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      )}

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Subtasks ({subtasks.length})
          </p>
          <div className="space-y-2">
            {subtasks.map((subtask, i) => (
              <SubtaskItem
                key={i}
                subtask={subtask}
                taskId={task.id}
                subtaskIndex={i}
                isLive={isLive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {task.error && !isLive && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {task.error}
        </div>
      )}
    </div>
  );
}

function computeProgress(steps: TaskStep[]): number {
  if (!steps.length) return 0;
  const completed = steps.filter((s) => s.status === "completed").length;
  return Math.round((completed / steps.length) * 100);
}
