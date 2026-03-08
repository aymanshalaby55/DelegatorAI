"use client";

import { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  copyToClipboard,
  filterTranscript,
  parseTranscript,
} from "@/utils/meeting-utils";
import type { Meeting } from "@/types/meeting";

interface TranscriptTabProps {
  meeting: Meeting;
}

// Detect if a string contains Arabic characters
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Palette of distinct colors for speakers
const SPEAKER_COLORS = [
  { text: "#7C3AED", bg: "#EDE9FE" },
  { text: "#0369A1", bg: "#E0F2FE" },
  { text: "#B45309", bg: "#FEF3C7" },
  { text: "#065F46", bg: "#D1FAE5" },
  { text: "#9D174D", bg: "#FCE7F3" },
  { text: "#1D4ED8", bg: "#DBEAFE" },
  { text: "#7E22CE", bg: "#F3E8FF" },
  { text: "#C2410C", bg: "#FFEDD5" },
  { text: "#0F766E", bg: "#CCFBF1" },
  { text: "#BE123C", bg: "#FFE4E6" },
];

function useSpeakerColors(lines: { speaker?: string }[]) {
  return useMemo(() => {
    const map = new Map<string, (typeof SPEAKER_COLORS)[0]>();
    let index = 0;
    for (const line of lines) {
      if (line.speaker && !map.has(line.speaker)) {
        map.set(line.speaker, SPEAKER_COLORS[index % SPEAKER_COLORS.length]);
        index++;
      }
    }
    return map;
  }, [lines]);
}

export function TranscriptTab({ meeting }: TranscriptTabProps) {
  const [search, setSearch] = useState("");

  const transcriptLines = useMemo(
    () => parseTranscript(meeting.transcript),
    [meeting.transcript],
  );

  const filteredLines = useMemo(
    () => filterTranscript(transcriptLines, search),
    [transcriptLines, search],
  );

  const speakerColors = useSpeakerColors(transcriptLines);

  const handleCopyAll = async () => {
    if (!meeting.transcript) return;
    await copyToClipboard(meeting.transcript);
    toast.success("Transcript copied");
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcript…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-border shrink-0"
          onClick={handleCopyAll}
          disabled={!meeting.transcript}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy All
        </Button>
      </div>

      {/* Lines */}
      <div className="h-[420px] overflow-y-auto rounded-xl bg-muted/30 border border-border p-4">
        {filteredLines.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            {search ? "No matching lines" : "No transcript available"}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredLines.map((line, i) => {
              const color = line.speaker
                ? speakerColors.get(line.speaker)
                : undefined;
              const lineDir = containsArabic(line.text) ? "rtl" : "ltr";
              return (
                <div
                  key={i}
                  className="text-base leading-relaxed px-1"
                  dir={lineDir}
                >
                  {line.speaker && (
                    <span
                      className="font-semibold mr-2"
                      style={color ? { color: color.text } : undefined}
                    >
                      {line.speaker}:
                    </span>
                  )}
                  <span className="text-foreground/85">{line.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Speaker legend */}
      {speakerColors.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(speakerColors.entries()).map(([speaker, color]) => (
            <span
              key={speaker}
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color.text }}
              />
              {speaker}
            </span>
          ))}
        </div>
      )}

      {/* Footer count */}
      <p className="text-xs text-muted-foreground">
        {transcriptLines.length} lines
        {search && ` • ${filteredLines.length} matching`}
      </p>
    </div>
  );
}
