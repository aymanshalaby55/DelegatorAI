"use client";

import { CheckSquare, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@/types/meeting";

interface TasksTabProps {
  meeting: Meeting;
}

export function TasksTab({ meeting }: TasksTabProps) {
  const hasSummary = Boolean(meeting.summary);

  const tasks: string[] = [];

  if (tasks.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-col items-center justify-center py-16 space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-warning/15 flex items-center justify-center">
            <CheckSquare className="h-7 w-7 text-warning" />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">
              No tasks extracted
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {hasSummary
                ? "No action items were found in this meeting's summary."
                : "Generate a summary first to automatically extract action items and tasks."}
            </p>
          </div>

          {!hasSummary && (
            <Button
              variant="outline"
              className="gap-2 border-border"
              onClick={() => toast.success("Generate a summary first!")}
            >
              <Sparkles className="h-4 w-4" />
              Generate Summary First
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground">
        Action Items
      </h3>
      <ul className="space-y-2">
        {tasks.map((task, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed"
          >
            <CheckSquare className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}
