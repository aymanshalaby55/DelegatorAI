"use client";

import { useRouter } from "next/navigation";
import { Video, CheckSquare, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { meetingStatusStyle, taskStatusStyle } from "@/types/history";
import type { TimelineEvent } from "@/types/history";

interface EventRowProps {
  event: TimelineEvent;
}

export function EventRow({ event }: EventRowProps) {
  const router = useRouter();
  const statusMap =
    event.type === "meeting" ? meetingStatusStyle : taskStatusStyle;
  const style = statusMap[event.status ?? ""] ?? statusMap.pending;

  return (
    <div
      className={`flex items-start gap-3 py-3 transition-colors rounded-lg px-2 -mx-2 ${
        event.href ? "cursor-pointer hover:bg-muted/30 group" : ""
      }`}
      onClick={() => event.href && router.push(event.href)}
    >
      {/* Type icon */}
      <div
        className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
          event.type === "meeting"
            ? "bg-primary/15 text-primary"
            : "bg-violet-500/15 text-violet-400"
        }`}
      >
        {event.type === "meeting" ? (
          <Video className="h-4 w-4" />
        ) : (
          <CheckSquare className="h-4 w-4" />
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate max-w-[260px] sm:max-w-none leading-snug">
            {event.title}
          </p>
          {event.status && (
            <Badge
              variant="outline"
              className={`text-xs capitalize shrink-0 ${style.badge}`}
            >
              {style.label}
            </Badge>
          )}
        </div>
        {event.meta && (
          <p className="text-xs text-muted-foreground mt-0.5">{event.meta}</p>
        )}
      </div>

      {/* Time + arrow */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {event.date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {event.href && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
}
