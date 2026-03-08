import {
  Clock,
  ExternalLink,
  MoreHorizontal,
  FileText,
  Mic,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "./PlatformIcon";
import { Meeting } from "@/types/meeting";

const statusColor: Record<string, string> = {
  joining: "bg-warning/15 text-warning border-warning/20",
  in_progress: "bg-primary/15 text-primary border-primary/20",
  completed: "bg-success/15 text-success border-success/20",
  failed: "bg-destructive/15 text-destructive border-destructive/20",
};

const statusLabel: Record<string, string> = {
  joining: "Joining",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed",
};

function detectPlatform(url: string | null | undefined): string {
  if (!url) return "Unknown";
  if (url.includes("zoom.us")) return "Zoom";
  if (url.includes("meet.google")) return "Google Meet";
  if (url.includes("teams.microsoft")) return "Teams";
  return "Unknown";
}

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return "";
  return status.toLowerCase().replace(" ", "_");
}

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const status = normalizeStatus(meeting.status);
  const platform = detectPlatform(meeting.meeting_url);
  const isMeetingLinkDisabled = status === "completed";

  return (
    <div
      onClick={onClick}
      className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer group"
    >
      {/* Platform icon */}
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <PlatformIcon platform={platform} className="h-6 w-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground text-sm truncate">
            {meeting.title}
          </span>
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground shrink-0"
          >
            {platform}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(meeting.created_at).toLocaleString()}
          </span>
          {meeting.transcript && <Mic className="h-3 w-3" />}
          {meeting.summary && <FileText className="h-3 w-3" />}
        </div>
      </div>

      <Badge
        variant="secondary"
        className={`text-xs font-medium shrink-0 ${statusColor[status] ?? "bg-muted text-muted-foreground"}`}
      >
        {statusLabel[status] ?? meeting.status}
      </Badge>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          disabled={isMeetingLinkDisabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!isMeetingLinkDisabled && meeting.meeting_url) {
              window.open(meeting.meeting_url, "_blank");
            }
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
