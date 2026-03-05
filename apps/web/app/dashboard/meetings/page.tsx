"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { JoinMeetingDialog } from "@/components/meeting/Joinmeetingdialog";
import { MeetingList } from "@/components/meeting/MeetingList";
import type { Meeting } from "@/components/meeting/MeetingCard";

const MEETINGS: Meeting[] = [
  {
    id: 1,
    title: "Sprint Planning",
    platform: "Zoom",
    url: "https://zoom.us/j/123",
    time: "Today, 2:00 PM",
    status: "Pending",
    participants: 6,
    features: ["transcription", "summary"],
  },
  {
    id: 2,
    title: "Design Review",
    platform: "Google Meet",
    url: "https://meet.google.com/abc",
    time: "Today, 4:30 PM",
    status: "Pending",
    participants: 4,
    features: ["transcription", "tasks"],
  },
  {
    id: 3,
    title: "Daily Standup",
    platform: "Teams",
    url: "https://teams.microsoft.com/l/123",
    time: "Yesterday, 9:00 AM",
    status: "Completed",
    participants: 8,
    features: ["transcription", "summary", "tasks"],
  },
  {
    id: 4,
    title: "Client Sync",
    platform: "Zoom",
    url: "https://zoom.us/j/456",
    time: "Yesterday, 1:00 PM",
    status: "Completed",
    participants: 3,
    features: ["transcription", "summary"],
  },
  {
    id: 5,
    title: "Retrospective",
    platform: "Google Meet",
    url: "https://meet.google.com/xyz",
    time: "2 days ago",
    status: "Completed",
    participants: 7,
    features: ["transcription", "summary", "tasks"],
  },
];

const FILTERS = ["All", "Pending", "In Progress", "Completed"];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MeetingsPage() {
  const [filter, setFilter] = useState("All");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Meetings
        </h1>
        <JoinMeetingDialog />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            className="pl-10 bg-muted border-border"
          />
        </div>

        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === s
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      <MeetingList meetings={MEETINGS} filter={filter} />
    </motion.div>
  );
}
