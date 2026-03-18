"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Video, CheckSquare, Search, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetings } from "@/hooks/useMeeting";
import { useTasks } from "@/hooks/useTasks";

type EventType = "meeting" | "task";

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  date: Date;
  status?: string;
  meta?: string;
  href?: string;
}

const meetingStatusStyle: Record<string, { dot: string; badge: string; label: string }> = {
  completed: {
    dot: "bg-green-500",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
    label: "Completed",
  },
  in_progress: {
    dot: "bg-primary",
    badge: "bg-primary/15 text-primary border-primary/25",
    label: "In Progress",
  },
  joining: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    label: "Joining",
  },
  failed: {
    dot: "bg-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/25",
    label: "Failed",
  },
  pending: {
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
    label: "Pending",
  },
};

const taskStatusStyle: Record<string, { dot: string; badge: string; label: string }> = {
  completed: {
    dot: "bg-green-500",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
    label: "Completed",
  },
  processing: {
    dot: "bg-blue-400",
    badge: "bg-blue-400/15 text-blue-400 border-blue-400/25",
    label: "Processing",
  },
  failed: {
    dot: "bg-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/25",
    label: "Failed",
  },
  pending: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    label: "Pending",
  },
};

function groupByDate(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  const groups: Record<string, TimelineEvent[]> = {};
  for (const ev of events) {
    const now = new Date();
    const isToday =
      ev.date.getFullYear() === now.getFullYear() &&
      ev.date.getMonth() === now.getMonth() &&
      ev.date.getDate() === now.getDate();
    const isYesterday =
      ev.date.getFullYear() === now.getFullYear() &&
      ev.date.getMonth() === now.getMonth() &&
      ev.date.getDate() === now.getDate() - 1;

    const key = isToday
      ? "Today"
      : isYesterday
        ? "Yesterday"
        : ev.date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  }
  return groups;
}

function EventRow({ event }: { event: TimelineEvent }) {
  const router = useRouter();
  const statusMap = event.type === "meeting" ? meetingStatusStyle : taskStatusStyle;
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

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {event.date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
        {event.href && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <div className="glass rounded-2xl px-4 py-1 divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const { data: meetings = [], isLoading: meetingsLoading } = useMeetings();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();

  const loading = meetingsLoading || tasksLoading;

  const events: TimelineEvent[] = useMemo(() => {
    const meetingEvents: TimelineEvent[] = meetings.map((m) => ({
      id: `meeting-${m.id}`,
      type: "meeting" as const,
      title: m.title || "Untitled Meeting",
      date: new Date(m.created_at),
      status: m.status ?? undefined,
      meta: m.summary ? "Summary available" : undefined,
      href: `/dashboard/meetings/${m.id}`,
    }));

    const taskEvents: TimelineEvent[] = tasks.map((t) => ({
      id: `task-${t.id}`,
      type: "task" as const,
      title: t.prompt,
      date: new Date(t.created_at),
      status: t.status,
      meta: t.subtasks?.length
        ? `${t.subtasks.length} subtask${t.subtasks.length !== 1 ? "s" : ""}`
        : undefined,
    }));

    return [...meetingEvents, ...taskEvents].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }, [meetings, tasks]);

  const filtered = events.filter(
    (ev) => !search || ev.title.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = groupByDate(filtered);
  const dateKeys = Object.keys(grouped);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 lg:p-8 w-full space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Clock className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">History</h1>
          {!loading && filtered.length > 0 && (
            <Badge variant="secondary" className="text-xs rounded-full">
              {filtered.length}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Chronological log of all meetings and agent tasks.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-primary/15 flex items-center justify-center">
            <Video className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Meeting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-violet-500/15 flex items-center justify-center">
            <CheckSquare className="h-3 w-3 text-violet-400" />
          </div>
          <span className="text-xs text-muted-foreground">Agent Task</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search history…"
          className="pl-10 bg-muted border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      ) : dateKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Clock className="h-7 w-7 text-violet-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {search ? "No matching events" : "Nothing here yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search
                ? "Try a different keyword."
                : "Your meetings and agent tasks will appear here as you use the app."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((day) => (
            <div key={day} className="space-y-2">
              {/* Date header */}
              <div className="flex items-center gap-3">
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    day === "Today"
                      ? "text-primary"
                      : day === "Yesterday"
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {day}
                </p>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{grouped[day].length}</span>
              </div>

              {/* Events card */}
              <div className="glass rounded-2xl px-4 py-1 divide-y divide-border/50">
                {grouped[day].map((ev) => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
