// components/MeetingList.tsx
import { MeetingCard } from "./MeetingCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Meeting } from "@/types/meeting";

type Props = {
  meetings: Meeting[];
  filter: string;
  isLoading?: boolean;
  error?: string | null;
};

export function MeetingList({ meetings, filter, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive text-center py-10">{error}</p>
    );
  }

  const filtered = meetings.filter(
    (m) => filter === "All" || m.status === filter,
  );

  return (
    <div className="grid gap-3">
      {filtered.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">
          No meetings found.
        </p>
      )}
    </div>
  );
}
