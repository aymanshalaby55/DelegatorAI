import { Skeleton } from "@/components/ui/skeleton";

export function MeetingTaskSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
