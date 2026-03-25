export type EventType = "meeting" | "task";

export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  date: Date;
  status?: string;
  meta?: string;
  href?: string;
}

export interface StatusStyleEntry {
  dot: string;
  badge: string;
  label: string;
}

export const meetingStatusStyle: Record<string, StatusStyleEntry> = {
  completed: {
    dot: "bg-green-500",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
    label: "Completed",
  },
  in_progress: {
    dot: "bg-primary",
    badge: "bg-primary/15 text-primary border-primary/25",
    label: "In Progress",
  },
  joining: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    label: "Joining",
  },
  failed: {
    dot: "bg-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/25",
    label: "Failed",
  },
  pending: {
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
    label: "Pending",
  },
};

export const taskStatusStyle: Record<string, StatusStyleEntry> = {
  completed: {
    dot: "bg-green-500",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
    label: "Completed",
  },
  processing: {
    dot: "bg-blue-400",
    badge: "bg-blue-400/15 text-blue-400 border-blue-400/25",
    label: "Processing",
  },
  failed: {
    dot: "bg-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/25",
    label: "Failed",
  },
  pending: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    label: "Pending",
  },
};
