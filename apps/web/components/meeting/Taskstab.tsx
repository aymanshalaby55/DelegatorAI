"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Sparkles,
  ArrowUpRight,
  User,
  Github,
  MessageSquare,
  Loader2,
  Check,
  X,
  UserCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useMeetingTasks,
  useExtractTasks,
  usePushToGitHub,
  useNotifySlack,
} from "@/hooks/useMeeting";
import { useIntegrations, useGitHubCollaborators } from "@/hooks/useIntegrations";
import type { Meeting, MeetingTask, TaskPriority } from "@/types/meeting";
import type { GitHubCollaborator } from "@/services/integration-service";

interface TasksTabProps {
  meeting: Meeting;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high:   { label: "High",   className: "border-red-500/40 text-red-400" },
  medium: { label: "Medium", className: "border-yellow-500/40 text-yellow-400" },
  low:    { label: "Low",    className: "border-green-500/40 text-green-400" },
};

// ─── Collaborator picker dialog ──────────────────────────────────────────────

interface AssigneeDialogProps {
  open: boolean;
  task: MeetingTask;
  defaultRepo: string;
  githubConnected: boolean;
  onConfirm: (_assignees: string[]) => void;
  onClose: () => void;
}

function AssigneeDialog({
  open,
  task,
  defaultRepo,
  githubConnected,
  onConfirm,
  onClose,
}: AssigneeDialogProps) {
  const [selected, setSelected] = useState<string | null>(
    task.assignee_github ?? null,
  );

  const { data: collaborators = [], isLoading } = useGitHubCollaborators(
    defaultRepo,
    open && githubConnected && !!defaultRepo,
  );

  // When collaborators load, keep task's assignee_github if it's a real collaborator
  // otherwise reset to null so the user must pick manually
  const isPreSelectedValid =
    selected !== null && collaborators.some((c) => c.login === selected);

  function toggle(login: string) {
    setSelected((prev) => (prev === login ? null : login));
  }

  function handleConfirm() {
    onConfirm(selected ? [selected] : []);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            Create GitHub Issue
          </DialogTitle>
          <DialogDescription>
            Select who to assign{" "}
            <span className="font-medium text-foreground">{task.title}</span> to.
          </DialogDescription>
        </DialogHeader>

        {/* Task info strip */}
        <div className="rounded-lg bg-muted/40 px-3 py-2 space-y-0.5">
          <p className="text-xs font-medium text-foreground line-clamp-2">{task.title}</p>
          {task.assignee_name && (
            <p className="text-xs text-muted-foreground">
              Suggested by AI: <span className="text-foreground">{task.assignee_name}</span>
              {task.assignee_github && (
                <span className="text-primary ml-1">(@{task.assignee_github})</span>
              )}
            </p>
          )}
        </div>

        {/* Collaborator list */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {defaultRepo ? `Collaborators in ${defaultRepo}` : "Repository collaborators"}
          </p>

          {!defaultRepo ? (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
              No default repository set. Go to{" "}
              <span className="underline cursor-pointer">Integrations → GitHub settings</span> to
              pick one.
            </div>
          ) : isLoading ? (
            <div className="space-y-2 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              ))}
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No collaborators found for this repository.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {/* None option */}
              <button
                onClick={() => setSelected(null)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selected === null
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <UserCircle className="h-4 w-4" />
                </div>
                <span className="flex-1 text-left">Unassigned</span>
                {selected === null && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>

              {collaborators.map((c: GitHubCollaborator) => {
                const isSelected = selected === c.login;
                const isAiSuggested = c.login === task.assignee_github;
                return (
                  <button
                    key={c.login}
                    onClick={() => toggle(c.login)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    {/* Avatar */}
                    {c.avatar_url ? (
                      <Image
                        src={c.avatar_url}
                        alt={c.login}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold">
                        {c.login.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="flex-1 text-left truncate">{c.login}</span>

                    {isAiSuggested && !isSelected && (
                      <Badge
                        variant="outline"
                        className="text-xs h-4 px-1 border-primary/40 text-primary/70 shrink-0"
                      >
                        AI
                      </Badge>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!isPreSelectedValid && selected !== null && collaborators.length > 0 && (
          <p className="text-xs text-yellow-400 flex items-center gap-1">
            <X className="h-3 w-3" />
            &quot;{selected}&quot; is not a collaborator on this repo — please pick from the list.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleConfirm}
            disabled={!defaultRepo || isLoading}
          >
            <Github className="h-3.5 w-3.5" />
            Create Issue
            {selected && <span className="text-xs opacity-70">→ @{selected}</span>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Task item row ───────────────────────────────────────────────────────────

interface TaskItemProps {
  task: MeetingTask;
  githubConnected: boolean;
  slackConnected: boolean;
  defaultRepo: string;
  isPushingThis: boolean;
  isNotifyingThis: boolean;
  onPushGitHub: (_taskId: string, _assignees: string[]) => void;
  onNotifySlack: () => void;
}

function TaskItem({
  task,
  githubConnected,
  slackConnected,
  defaultRepo,
  isPushingThis,
  isNotifyingThis,
  onPushGitHub,
  onNotifySlack,
}: TaskItemProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
  const hasIssue = Boolean(task.github_issue_url);

  function handleGitHubClick() {
    if (!githubConnected) {
      toast.error("GitHub not connected — go to Integrations to connect it.");
      router.push("/dashboard/integrations");
      return;
    }
    setDialogOpen(true);
  }

  function handleSlackClick() {
    if (!slackConnected) {
      toast.error("Slack not connected — go to Integrations to connect it.");
      router.push("/dashboard/integrations");
      return;
    }
    onNotifySlack();
  }

  function handleConfirm(assignees: string[]) {
    setDialogOpen(false);
    onPushGitHub(task.id, assignees);
  }

  return (
    <>
      <li className="flex items-start gap-3 py-3 border-b border-border last:border-0">
        <CheckSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <Badge variant="outline" className={`text-xs py-0 h-5 ${priority.className}`}>
                {priority.label}
              </Badge>

              {hasIssue ? (
                <a
                  href={task.github_issue_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                >
                  <Github className="h-3 w-3" />
                  #{task.github_issue_number}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <button
                  onClick={handleGitHubClick}
                  disabled={isPushingThis}
                  title={githubConnected ? "Create GitHub issue" : "Connect GitHub first"}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPushingThis ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Github className="h-3 w-3" />
                  )}
                  {isPushingThis ? "Creating…" : "Push to GitHub"}
                </button>
              )}

              {task.slack_notified_at ? (
                <Badge
                  variant="outline"
                  className="text-xs py-0 h-5 border-green-500/40 text-green-500"
                >
                  <MessageSquare className="h-2.5 w-2.5 mr-1" />
                  Notified
                </Badge>
              ) : (
                <button
                  onClick={handleSlackClick}
                  disabled={isNotifyingThis}
                  title={slackConnected ? "Send Slack notification" : "Connect Slack first"}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isNotifyingThis ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                  {isNotifyingThis ? "Sending…" : "Send to Slack"}
                </button>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
          )}

          {task.assignee_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {task.assignee_name}
              {task.assignee_github && (
                <span className="text-primary/70">(@{task.assignee_github})</span>
              )}
            </div>
          )}
        </div>
      </li>

      <AssigneeDialog
        open={dialogOpen}
        task={task}
        defaultRepo={defaultRepo}
        githubConnected={githubConnected}
        onConfirm={handleConfirm}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function TasksSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <Skeleton className="h-4 w-4 mt-0.5 rounded shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TasksTab ────────────────────────────────────────────────────────────────

export function TasksTab({ meeting }: TasksTabProps) {
  const router = useRouter();
  const hasSummary = Boolean(meeting.summary);

  const { data: tasks = [], isLoading, isError } = useMeetingTasks(meeting.id);
  const { mutate: extract, isPending: isExtracting } = useExtractTasks(meeting.id);
  const { mutate: pushGitHub, isPending: isPushingGitHub, variables: pushingVars } =
    usePushToGitHub(meeting.id);
  const {
    mutate: notifySlack,
    isPending: isNotifying,
    variables: notifyingVars,
  } = useNotifySlack(meeting.id);

  const { data: integrations = [] } = useIntegrations();
  const githubIntegration = integrations.find((i) => i.provider === "github");
  const githubConnected = Boolean(githubIntegration?.connected);
  const slackConnected = integrations.some((i) => i.provider === "slack" && i.connected);
  const defaultRepo = (githubIntegration?.metadata?.default_repo as string) ?? "";

  function handleSlackNotify() {
    if (!slackConnected) {
      toast.error("Slack not connected — go to Integrations to connect it.");
      router.push("/dashboard/integrations");
      return;
    }
    notifySlack(undefined);
  }

  // ── No summary ─────────────────────────────────────────────────────────────
  if (!hasSummary) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-col items-center justify-center py-16 space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-warning/15 flex items-center justify-center">
            <CheckSquare className="h-7 w-7 text-warning" />
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">No tasks extracted</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Generate a summary first to automatically extract action items.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Action Items</h3>
        <TasksSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load tasks.
        </div>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (tasks.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-col items-center justify-center py-16 space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-warning/15 flex items-center justify-center">
            <CheckSquare className="h-7 w-7 text-warning" />
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">No tasks extracted</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              No action items were found. Run the extractor to scan automatically.
            </p>
          </div>
          <Button className="gap-2" onClick={() => extract()} disabled={isExtracting}>
            <Sparkles className="h-4 w-4" />
            {isExtracting ? "Extracting…" : "Extract Action Items"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Task list ──────────────────────────────────────────────────────────────
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-foreground">Action Items</h3>
          <Badge variant="secondary" className="text-xs rounded-full">
            {tasks.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Integration status pills */}
          <Badge
            variant="outline"
            className={`text-xs py-0 h-5 cursor-pointer ${
              githubConnected
                ? "border-green-500/40 text-green-500"
                : "border-muted-foreground/30 text-muted-foreground"
            }`}
            onClick={() => !githubConnected && router.push("/dashboard/integrations")}
          >
            <Github className="h-2.5 w-2.5 mr-1" />
            {githubConnected ? (defaultRepo || "GitHub") : "GitHub: off"}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs py-0 h-5 cursor-pointer ${
              slackConnected
                ? "border-green-500/40 text-green-500"
                : "border-muted-foreground/30 text-muted-foreground"
            }`}
            onClick={() => !slackConnected && router.push("/dashboard/integrations")}
          >
            <MessageSquare className="h-2.5 w-2.5 mr-1" />
            {slackConnected ? "Slack" : "Slack: off"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-border"
            onClick={handleSlackNotify}
            disabled={isNotifying}
          >
            {isNotifying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            {isNotifying ? "Sending…" : "Notify Slack"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-border"
            onClick={() => extract()}
            disabled={isExtracting}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isExtracting ? "Re-extracting…" : "Re-extract"}
          </Button>
        </div>
      </div>

      {/* No default repo warning */}
      {githubConnected && !defaultRepo && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400 flex items-center gap-2">
          <Github className="h-3.5 w-3.5 shrink-0" />
          No default repository set. Go to{" "}
          <button
            onClick={() => router.push("/dashboard/integrations")}
            className="underline hover:no-underline"
          >
            Integrations → GitHub settings
          </button>{" "}
          to pick one.
        </div>
      )}

      {/* Tasks */}
      <ul className="divide-y divide-border">
        {tasks.map((task: MeetingTask) => (
          <TaskItem
            key={task.id}
            task={task}
            githubConnected={githubConnected}
            slackConnected={slackConnected}
            defaultRepo={defaultRepo}
            isPushingThis={
              isPushingGitHub && (pushingVars as { taskId: string } | undefined)?.taskId === task.id
            }
            isNotifyingThis={
              isNotifying &&
              Array.isArray(notifyingVars) &&
              notifyingVars[0] === task.id
            }
            onPushGitHub={(taskId, assignees) => pushGitHub({ taskId, assignees })}
            onNotifySlack={() => notifySlack([task.id])}
          />
        ))}
      </ul>
    </div>
  );
}
