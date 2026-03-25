"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Clock, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformIcon } from "@/components/meeting/PlatformIcon";
import { detectPlatform, summaryMarkdownComponents } from "@/lib/summaries";
import type { Meeting } from "@/types/meeting";

export function SummaryCardSkeleton() {
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

interface SummaryCardProps {
  meeting: Meeting;
}

export function SummaryCard({ meeting }: SummaryCardProps) {
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
                  onClick={() =>
                    router.push(`/dashboard/meetings/${meeting.id}`)
                  }
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={summaryMarkdownComponents}
          >
            {meeting.summary ?? ""}
          </ReactMarkdown>
        </div>

        {/* Expand / collapse */}
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
