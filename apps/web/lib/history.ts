import type { TimelineEvent } from "@/types/history";

export function groupByDate(
  events: TimelineEvent[],
): Record<string, TimelineEvent[]> {
  const groups: Record<string, TimelineEvent[]> = {};

  for (const ev of events) {
    const now = new Date();
    const isToday =
      ev.date.getFullYear() === now.getFullYear() &&
      ev.date.getMonth() === now.getMonth() &&
      ev.date.getDate() === now.getDate();
    const isYesterday =
      ev.date.getFullYear() === now.getFullYear() &&
      ev.date.getMonth() === now.getMonth() &&
      ev.date.getDate() === now.getDate() - 1;

    const key = isToday
      ? "Today"
      : isYesterday
        ? "Yesterday"
        : ev.date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  }

  return groups;
}
