"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { JoinMeetingDialog } from "@/components/meeting/Joinmeetingdialog";
import { MeetingList } from "@/components/meeting/MeetingList";
import { useMeetings } from "@/hooks/use-meeting";

const FILTERS = ["All", "Joining", "In Progress", "Completed", "Failed"];

export default function MeetingsPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { data: meetings = [], isLoading, isError, error } = useMeetings();

  const filtered = meetings
    .filter((m) => filter === "All" || m.status === filter)
    .filter((m) => m.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Meetings
        </h1>
        <JoinMeetingDialog />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            className="pl-10 bg-muted border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      <MeetingList
        meetings={filtered}
        filter={filter}
        isLoading={isLoading}
        error={isError ? error?.message : null}
      />
    </motion.div>
  );
}
