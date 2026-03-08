import type { TranscriptLine } from "@/types/meeting";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.round(ms / 60_000);
  if (m <= 0) return "< 1m";
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export function parseTranscript(raw: string | null): TranscriptLine[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        return {
          speaker: line.slice(0, colonIdx).trim(),
          text: line.slice(colonIdx + 1).trim(),
          raw: line,
        };
      }
      return { speaker: null, text: line, raw: line };
    });
}

export function filterTranscript(
  lines: TranscriptLine[],
  query: string,
): TranscriptLine[] {
  if (!query.trim()) return lines;
  const q = query.toLowerCase();
  return lines.filter((l) => l.raw.toLowerCase().includes(q));
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-success/15 text-success border-success/20",
  IN_PROGRESS: "bg-primary/15 text-primary border-primary/20",
  PENDING: "bg-warning/15 text-warning border-warning/20",
  FAILED: "bg-destructive/15 text-destructive border-destructive/20",
};
