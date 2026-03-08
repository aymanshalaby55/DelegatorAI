"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
// import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
// import { useGenerateSummary } from "@/hooks/useMeeting";
import type { Meeting, SummaryFormat, SummaryLength } from "@/types/meeting";

interface SummaryTabProps {
  meeting: Meeting;
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 capitalize transition-colors ${
            value === opt
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function SummaryTab({ meeting }: SummaryTabProps) {
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [summaryFormat, setSummaryFormat] = useState<SummaryFormat>("bullets");

  // const { mutate: generateSummary, isPending } = useGenerateSummary(meeting.id);

  const handleGenerate = () => {
    // generateSummary(
    //   { length: summaryLength, format: summaryFormat },
    //   {
    //     onSuccess: () => toast.success("Summary generated"),
    //     onError: () => toast.error("Failed to generate summary"),
    //   }
    // );
  };

  return (
    <div className="glass rounded-2xl p-5">
      {meeting.summary === null ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-16 space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">
              No summary yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Generate an AI-powered summary of this meeting's transcript.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ToggleGroup
              options={["short", "medium", "detailed"] as const}
              value={summaryLength}
              onChange={setSummaryLength}
            />
            <ToggleGroup
              options={["bullets", "paragraph"] as const}
              value={summaryFormat}
              onChange={setSummaryFormat}
            />
          </div>

          <Button className="gap-2 mt-2" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4" />
            {/* {isPending ? "Generating…" : "Generate Summary"} */}
            Generating…
          </Button>
        </div>
      ) : (
        /* ── Summary content ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Summary
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-border"
              // onClick={handleGenerate}
              // disabled={}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {/* {isPending ? "Regenerating…" : "Regenerate"} */}
              Regenerating…
            </Button>
          </div>
          <div className="prose prose-invert max-w-none text-sm">
            {meeting.summary}
          </div>
        </div>
      )}
    </div>
  );
}
