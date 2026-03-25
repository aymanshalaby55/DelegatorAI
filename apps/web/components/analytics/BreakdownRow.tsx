import { statusMeta } from "@/types/analytics";

export function BreakdownRow({
  status,
  count,
  total,
}: {
  status: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const meta = statusMeta[status] ?? {
    label: status,
    bar: "bg-muted-foreground/50",
    dot: "bg-muted-foreground",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
          <span className="text-muted-foreground">{meta.label}</span>
        </div>
        <span className="font-semibold text-foreground tabular-nums">
          {count}
          <span className="font-normal text-muted-foreground ml-1">
            ({pct}%)
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${meta.bar} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
