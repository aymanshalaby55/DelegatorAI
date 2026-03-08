"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { JoinMeetingDialog } from "@/components/meeting/Joinmeetingdialog";
import { useMeetings } from "@/hooks/useMeeting";
import { MeetingList } from "@/components/meeting/MeetingList";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Joining", "In Progress", "Completed", "Failed"];

export default function MeetingsPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const router = useRouter();

  const { data: meetings = [], isLoading, isError, error } = useMeetings();

  const filtered = meetings
    .filter((m) => filter === "All" || m.status === filter)
    .filter((m) => m.title?.toLowerCase().includes(search.toLowerCase()));

  const handleMeetingClick = (id: string) => {
    router.push(`/dashboard/meetings/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Meetings
        </h1>
        <JoinMeetingDialog />
      </div>

      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              className="pl-10 bg-muted border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Mobile: filter toggle button */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={cn(
              "md:hidden flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-border transition-colors shrink-0",
              filtersOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filter !== "All" ? filter : "Filter"}
          </button>
        </div>

        {/* Filter pills: collapsible on mobile, always visible on md+ */}
        <div
          className={cn(
            "flex flex-wrap gap-2",
            filtersOpen ? "flex" : "hidden md:flex",
          )}
        >
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setFiltersOpen(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                filter === s
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <MeetingList
        meetings={filtered}
        filter={filter}
        isLoading={isLoading}
        error={isError ? error?.message : null}
        onMeetingClick={handleMeetingClick}
      />
    </motion.div>
  );
}
