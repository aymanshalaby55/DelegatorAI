"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Video, CheckSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EventRow } from "@/components/history/EventRow";
import { SkeletonGroup } from "@/components/history/SkeletonGroup";
import { groupByDate } from "@/lib/history";
import { useMeetings } from "@/hooks/useMeeting";
import { useTasks } from "@/hooks/useTasks";
import type { TimelineEvent } from "@/types/history";

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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Clock className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            History
          </h1>
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
        <EmptyState search={search} />
      ) : (
        <div className="space-y-6">
          {dateKeys.map((day) => (
            <DateGroup key={day} day={day} events={grouped[day]} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Local sub-components (page-level only, too small to extract) ─────────────

function DateGroup({ day, events }: { day: string; events: TimelineEvent[] }) {
  return (
    <div className="space-y-2">
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
        <span className="text-xs text-muted-foreground">{events.length}</span>
      </div>

      <div className="glass rounded-2xl px-4 py-1 divide-y divide-border/50">
        {events.map((ev) => (
          <EventRow key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
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
  );
}
