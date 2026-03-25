"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SummaryCard,
  SummaryCardSkeleton,
} from "@/components/summaries/SummaryCard";
import { useMeetings } from "@/hooks/useMeeting";

export default function SummariesPage() {
  const [search, setSearch] = useState("");
  const { data: meetings = [], isLoading, isError, error } = useMeetings();

  const withSummaries = meetings
    .filter((m) => m.summary)
    .filter(
      (m) =>
        !search ||
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.summary?.toLowerCase().includes(search.toLowerCase()),
    );

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
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Summaries
          </h1>
          {!isLoading && withSummaries.length > 0 && (
            <Badge variant="secondary" className="text-xs rounded-full">
              {withSummaries.length}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generated summaries of your completed meetings.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search summaries…"
          className="pl-10 bg-muted border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load summaries: {error?.message ?? "Unknown error"}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </div>
      ) : withSummaries.length > 0 ? (
        <div className="space-y-4">
          {withSummaries.map((m) => (
            <SummaryCard key={m.id} meeting={m} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {search ? "No matching summaries" : "No summaries yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search
                ? "Try a different search term."
                : "Complete a meeting and generate a summary to see it here."}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
