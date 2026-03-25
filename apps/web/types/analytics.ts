export const statusMeta: Record<
  string,
  { label: string; bar: string; dot: string }
> = {
  completed: { label: "Completed", bar: "bg-green-500", dot: "bg-green-500" },
  in_progress: { label: "In Progress", bar: "bg-primary", dot: "bg-primary" },
  joining: { label: "Joining", bar: "bg-yellow-500", dot: "bg-yellow-500" },
  failed: { label: "Failed", bar: "bg-destructive", dot: "bg-destructive" },
  pending: {
    label: "Pending",
    bar: "bg-muted-foreground/50",
    dot: "bg-muted-foreground",
  },
};

export const meetingStatusBadge: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400 border-green-500/25",
  in_progress: "bg-primary/15 text-primary border-primary/25",
  joining: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  failed: "bg-destructive/15 text-destructive border-destructive/25",
  pending: "bg-muted text-muted-foreground border-border",
};
