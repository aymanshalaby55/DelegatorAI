"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Share2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  copyToClipboard,
  formatDate,
  formatTime,
  getDuration,
  STATUS_STYLES,
} from "@/utils/meeting-utils";
import type { Meeting } from "@/types/meeting";

interface MeetingHeaderProps {
  meeting: Meeting;
}

export function MeetingHeader({ meeting }: MeetingHeaderProps) {
  const handleCopyLink = async () => {
    await copyToClipboard(meeting.meeting_url);
    toast.success("Meeting link copied");
  };

  const handleShare = async () => {
    await copyToClipboard(window.location.href);
    toast.success("Share link copied");
  };

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: title + meta */}
        <div className="space-y-3 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground truncate">
              {meeting.title}
            </h1>
            <Badge
              variant="secondary"
              className={`text-xs font-medium shrink-0 ${STATUS_STYLES[meeting.status] ?? ""}`}
            >
              {meeting.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Date / time / duration */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              {formatDate(meeting.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0" />
              {formatTime(meeting.created_at)} –{" "}
              {formatTime(meeting.updated_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {getDuration(meeting.created_at, meeting.updated_at)}
            </span>
          </div>

          {/* Platform + link */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Video className="h-4 w-4 text-primary" />
              </div>
              <span className="text-foreground font-medium">
                {meeting.platform}
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors glass-highlight rounded-lg px-3 py-1.5"
            >
              <span className="max-w-[200px] truncate">
                {meeting.meeting_url}
              </span>
              <Copy className="h-3 w-3 shrink-0" />
            </button>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-border"
            asChild
          >
            <a href={meeting.meeting_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Open Link
            </a>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-border"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-strong border-border">
              <DropdownMenuItem
                onClick={() => toast.success("Downloading transcript…")}
              >
                Transcript (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.success("Downloading JSON…")}
              >
                Full data (.json)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.success("Generating PDF…")}
              >
                Summary (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border text-muted-foreground hover:text-foreground"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="sr-only">Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
