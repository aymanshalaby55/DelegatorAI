import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonGroup() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <div className="glass rounded-2xl px-4 py-1 divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
