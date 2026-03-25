import { Skeleton } from "@/components/ui/skeleton";

export function IntegrationCardSkeleton() {
  return (
    <div className="rounded-xl ring-1 ring-foreground/10 bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}
