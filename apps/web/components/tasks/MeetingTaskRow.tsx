"use client";

import { useRouter } from "next/navigation";
import { Github, MessageSquare, User, Flag, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MeetingTask } from "@/types/meeting";

const priorityStyle: Record<string, { color: string; label: string }> = {
  high: {
    color: "text-red-400 border-red-400/30 bg-red-400/10",
    label: "High",
  },
  medium: {
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    label: "Medium",
  },
  low: {
    color: "text-green-400 border-green-400/30 bg-green-400/10",
    label: "Low",
  },
};

interface MeetingTaskRowProps {
  task: MeetingTask;
}

export function MeetingTaskRow({ task }: MeetingTaskRowProps) {
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
          <Badge
            variant="outline"
            className={`text-xs h-5 px-1.5 ${prio.color}`}
          >
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
              <Github className="h-3 w-3" />#{task.github_issue_number}
            </a>
          ) : (
            <Badge
              variant="outline"
              className="text-xs h-5 px-1.5 text-muted-foreground border-border"
            >
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
            onClick={() =>
              router.push(`/dashboard/meetings/${task.meeting_id}`)
            }
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
