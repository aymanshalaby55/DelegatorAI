"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Video,
  FileText,
  CheckSquare,
  Puzzle,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMeetings } from "@/hooks/useMeeting";
import { useTasks } from "@/hooks/useTasks";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useRouter } from "next/navigation";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  loading?: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  borderColor,
  loading,
}: StatCardProps) {
  return (
    <div className={`glass rounded-2xl p-5 space-y-4 border-t-2 ${borderColor}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-3xl font-bold text-foreground font-display tabular-nums">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      )}
    </div>
  );
}

const statusMeta: Record<string, { label: string; bar: string; dot: string }> = {
  completed: { label: "Completed", bar: "bg-green-500", dot: "bg-green-500" },
  in_progress: { label: "In Progress", bar: "bg-primary", dot: "bg-primary" },
  joining: { label: "Joining", bar: "bg-yellow-500", dot: "bg-yellow-500" },
  failed: { label: "Failed", bar: "bg-destructive", dot: "bg-destructive" },
  pending: { label: "Pending", bar: "bg-muted-foreground/50", dot: "bg-muted-foreground" },
};

const meetingStatusBadge: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400 border-green-500/25",
  in_progress: "bg-primary/15 text-primary border-primary/25",
  joining: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  failed: "bg-destructive/15 text-destructive border-destructive/25",
  pending: "bg-muted text-muted-foreground border-border",
};

function BreakdownRow({
  status,
  count,
  total,
}: {
  status: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const meta = statusMeta[status] ?? { label: status, bar: "bg-muted-foreground/50", dot: "bg-muted-foreground" };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
          <span className="text-muted-foreground">{meta.label}</span>
        </div>
        <span className="font-semibold text-foreground tabular-nums">
          {count}
          <span className="font-normal text-muted-foreground ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${meta.bar} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: meetings = [], isLoading: meetingsLoading } = useMeetings();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: integrations = [], isLoading: intLoading } = useIntegrations();

  const completed = meetings.filter((m) => m.status === "completed").length;
  const withSummaries = meetings.filter((m) => m.summary).length;
  const connectedIntegrations = integrations.filter((i) => i.connected).length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const statusGroups: Record<string, number> = meetings.reduce<Record<string, number>>(
    (acc, m) => {
      const s = m.status ?? "unknown";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const loading = meetingsLoading || tasksLoading || intLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 lg:p-8 w-full space-y-8"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Analytics
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Overview of your meetings, tasks, and integrations.
        </p>
      </div>

      {/* Stat grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Video}
          label="Meetings"
          value={meetings.length}
          sub={`${completed} completed`}
          iconBg="bg-primary/15"
          iconColor="text-primary"
          borderColor="border-primary/40"
          loading={loading}
        />
        <StatCard
          icon={FileText}
          label="Summaries"
          value={withSummaries}
          sub={
            meetings.length > 0
              ? `${Math.round((withSummaries / meetings.length) * 100)}% of meetings`
              : "—"
          }
          iconBg="bg-blue-400/15"
          iconColor="text-blue-400"
          borderColor="border-blue-400/40"
          loading={loading}
        />
        <StatCard
          icon={CheckSquare}
          label="Agent Tasks"
          value={tasks.length}
          sub={`${completedTasks} completed`}
          iconBg="bg-green-500/15"
          iconColor="text-green-400"
          borderColor="border-green-500/40"
          loading={loading}
        />
        <StatCard
          icon={Puzzle}
          label="Integrations"
          value={connectedIntegrations}
          sub={`of ${integrations.length} available`}
          iconBg="bg-violet-500/15"
          iconColor="text-violet-400"
          borderColor="border-violet-500/40"
          loading={loading}
        />
      </div>

      {/* Two-column detail section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="glass rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Meeting Status Breakdown</h2>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Video className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No meeting data yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(statusGroups).map(([status, count]) => (
                <BreakdownRow
                  key={status}
                  status={status}
                  count={count}
                  total={meetings.length}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent meetings */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recent Meetings</h2>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 transition-colors"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Video className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No meetings yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {meetings.slice(0, 7).map((m) => {
                const meta = statusMeta[m.status ?? ""] ?? statusMeta.pending;
                const badgeClass =
                  meetingStatusBadge[m.status ?? ""] ??
                  "bg-muted text-muted-foreground border-border";
                return (
                  <div
                    key={m.id}
                    onClick={() => router.push(`/dashboard/meetings/${m.id}`)}
                    className="flex items-center gap-3 py-1.5 rounded-lg px-1.5 -mx-1.5 cursor-pointer hover:bg-muted/30 transition-colors group"
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                    <p className="text-sm text-foreground truncate flex-1">
                      {m.title || "Untitled"}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs hidden sm:inline-flex shrink-0 ${badgeClass}`}
                    >
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
