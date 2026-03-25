import { Skeleton } from "../ui/skeleton";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  loading?: boolean;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  borderColor,
  loading,
}: StatCardProps) {
  return (
    <div
      className={`glass rounded-2xl p-5 space-y-4 border-t-2 ${borderColor}`}
    >
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-3xl font-bold text-foreground font-display tabular-nums">
            {value}
          </p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      )}
    </div>
  );
}
