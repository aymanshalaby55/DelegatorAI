"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { FileText, CheckSquare, Sparkles } from "lucide-react";
// Removed unused Tabs imports
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
// import { MeetingSidebar } from "@/components/meeting/MeetingSidebar";
import { MeetingDetailSkeleton } from "@/components/meeting/Meetingdetailskeleton";
import { TranscriptTab } from "@/components/meeting/Trasncriptab";
import { SummaryTab } from "@/components/meeting/Summarytab";
import { TasksTab } from "@/components/meeting/Taskstab";
import { useMeeting } from "@/hooks/useMeeting";
import { MeetingSidebar } from "@/components/meeting/Meetingsidebar";

import { useParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "transcript", label: "Transcript", icon: FileText },
  { value: "summary", label: "Summary", icon: Sparkles },
  { value: "tasks", label: "Tasks", icon: CheckSquare },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const { data: meeting, isLoading, isError, error } = useMeeting(meetingId!);

  // 👇 Declare all hooks FIRST, before any early returns
  const [activeTab, setActiveTab] = useState<TabValue>("transcript");

  /* ── Loading ── */
  if (isLoading) return <MeetingDetailSkeleton />;

  if (isError || !meeting) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="glass rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-destructive/15 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-1">
              Failed to load meeting
            </h2>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message ??
                "An unexpected error occurred. Please try again."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 w-full"
    >
      <MeetingHeader meeting={meeting} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Tabs — fully custom, no Radix */}
        <div className="flex flex-col gap-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1 mb-4">
            {TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Panels */}
          {activeTab === "transcript" && <TranscriptTab meeting={meeting} />}
          {activeTab === "summary" && <SummaryTab meeting={meeting} />}
          {activeTab === "tasks" && <TasksTab meeting={meeting} />}
        </div>

        <MeetingSidebar meeting={meeting} />
      </div>
    </motion.div>
  );
}
