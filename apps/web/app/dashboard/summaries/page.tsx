"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Search, ExternalLink, Clock, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetings } from "@/hooks/useMeeting";
import { PlatformIcon } from "@/components/meeting/PlatformIcon";
import type { Meeting } from "@/types/meeting";

function detectPlatform(url: string | null | undefined): string {
  if (!url) return "Unknown";
  if (url.includes("zoom.us")) return "Zoom";
  if (url.includes("meet.google")) return "Google Meet";
  if (url.includes("teams.microsoft")) return "Teams";
  return "Unknown";
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-primary mt-4 mb-1.5 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold text-primary/80 mt-3 mb-1 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-foreground mt-2 mb-1 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-muted-foreground leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="text-foreground/80">{children}</em>,
  ul: ({ children }) => (
    <ul className="space-y-1 my-2 pl-4 list-none">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1 my-2 pl-4 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-muted-foreground flex gap-2 items-start">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-sm text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-primary">{children}</code>
  ),
  hr: () => <hr className="border-border my-3" />,
};

function SummaryCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="border-l-4 border-primary/20 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

function SummaryCard({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const platform = detectPlatform(meeting.meeting_url);
  const isLong = (meeting.summary?.length ?? 0) > 400;

  return (
    <div className="glass rounded-2xl overflow-hidden border-l-4 border-primary/40 hover:border-primary/70 transition-colors">
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <PlatformIcon platform={platform} className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground truncate">
                {meeting.title || "Untitled Meeting"}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  variant="outline"
                  className="text-xs border-primary/30 text-primary/80 bg-primary/5"
                >
                  {platform}
                </Badge>
                <button
                  onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
                  className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                  title="Open meeting"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {new Date(meeting.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Summary — scrollable when expanded */}
        <div
          className={`transition-all duration-300 overflow-y-auto ${
            expanded ? "max-h-[420px]" : "max-h-40"
          } pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {meeting.summary ?? ""}
          </ReactMarkdown>
        </div>

        {/* Expand/collapse */}
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 transition-colors font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Read full summary
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

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
