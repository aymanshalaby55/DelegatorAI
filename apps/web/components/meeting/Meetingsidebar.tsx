"use client";

import { RefreshCw, Share2, Trash2 } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { useDeleteMeeting, useReprocessMeeting } from "@/hooks/useMeeting";
import {
  copyToClipboard,
  formatDate,
  getDuration,
} from "@/utils/meeting-utils";
import type { Meeting } from "@/types/meeting";

interface MeetingSidebarProps {
  meeting: Meeting;
}

export function MeetingSidebar({ meeting }: MeetingSidebarProps) {
  // const router = useRouter();

  // const { mutate: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();
  // const { mutate: reprocessMeeting, isPending: isReprocessing } = useReprocessMeeting();

  // Hook-disabling stub states
  const isDeleting = false;
  const isReprocessing = false;

  // Handlers disabled (no-op or info only)
  const handleDelete = () => {
    // deleteMeeting(meeting.id, {
    //   onSuccess: () => {
    //     toast.success("Meeting deleted");
    //     router.push("/dashboard");
    //   },
    //   onError: () => toast.error("Failed to delete meeting"),
    // });
    alert("Delete meeting action is disabled (hooks not available).");
  };

  const handleReprocess = () => {
    // reprocessMeeting(meeting.id, {
    //   onSuccess: () => toast.success("Meeting re-processing started"),
    //   onError: () => toast.error("Failed to reprocess meeting"),
    // });
    alert("Re-process meeting action is disabled (hooks not available).");
  };

  const handleShare = async () => {
    await copyToClipboard(window.location.href);
    // toast.success("Link copied");
    alert("Link copied (simulated, toast disabled).");
  };

  const metaRows = [
    {
      label: "Duration",
      value: getDuration(meeting.created_at, meeting.updated_at),
    },
    { label: "Provider", value: meeting.provider },
    { label: "Bot ID", value: meeting.bot_id.slice(0, 8) + "…" },
    { label: "Meeting ID", value: meeting.id.slice(0, 8) + "…" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Details ── */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Details
        </h3>
        <div className="space-y-3 text-sm">
          {metaRows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center gap-2"
            >
              <span className="text-muted-foreground shrink-0">
                {row.label}
              </span>
              <span className="text-foreground font-medium text-right truncate max-w-[140px]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Actions
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs border-border"
            onClick={handleReprocess}
            disabled={isReprocessing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isReprocessing ? "animate-spin" : ""}`}
            />
            {isReprocessing ? "Re-processing…" : "Re-process Meeting"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs border-border"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Meeting
          </Button>

          {/* Delete with confirmation dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border">
              <DialogHeader>
                <DialogTitle className="font-display">
                  Delete Meeting
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete the meeting, transcript, summary,
                  and all extracted tasks. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="border-border">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Timestamps ── */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Timestamps
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between gap-2">
            <span>Created</span>
            <span className="text-foreground">
              {formatDate(meeting.created_at)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Updated</span>
            <span className="text-foreground">
              {formatDate(meeting.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
