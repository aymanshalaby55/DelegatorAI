"use client";

import { Settings, ExternalLink, Clock, Plug, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useConnectIntegration,
  useDisconnectIntegration,
} from "@/hooks/useIntegrations";
import type { IntegrationInfo } from "@/types/integration";

// ---------------------------------------------------------------------------
// Provider static config
// ---------------------------------------------------------------------------

interface ProviderConfig {
  label: string;
  icon: React.ReactNode;
  externalUrl: string;
  describeMetadata: (metadata: Record<string, string>) => string | null;
}

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
);

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  github: {
    label: "GitHub",
    icon: <GitHubIcon />,
    externalUrl: "https://github.com",
    describeMetadata: (meta) => {
      if (meta.login) return `@${meta.login}`;
      return null;
    },
  },
  slack: {
    label: "Slack",
    icon: <SlackIcon />,
    externalUrl: "https://slack.com",
    describeMetadata: (meta) => {
      const parts: string[] = [];
      if (meta.team_name) parts.push(meta.team_name);
      if (meta.default_channel) parts.push(meta.default_channel);
      return parts.length ? parts.join(" · ") : null;
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IntegrationCardProps {
  integration: IntegrationInfo;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const { provider, connected, connected_at, metadata } = integration;
  const config = PROVIDER_CONFIG[provider];

  const { mutate: connect, isPending: isConnecting } = useConnectIntegration();
  const { mutate: disconnect, isPending: isDisconnecting } =
    useDisconnectIntegration();

  if (!config) return null;

  const metaLine = config.describeMetadata(metadata);
  const relativeTime = connected_at ? formatRelativeTime(connected_at) : null;

  return (
    <Card className="relative transition-all hover:ring-border/40">
      <CardContent className="pt-2">
        <div className="flex items-start justify-between gap-3">
          {/* Left: icon + info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon container */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              {config.icon}
            </div>

            {/* Name + badge + meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground">
                  {config.label}
                </span>
                {connected ? (
                  <Badge
                    className="bg-success/15 text-success border-success/20 gap-1"
                    variant="outline"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not connected
                  </Badge>
                )}
              </div>

              {connected && (
                <div className="mt-0.5 space-y-0.5">
                  {metaLine && (
                    <p className="text-xs text-muted-foreground truncate">
                      {metaLine}
                    </p>
                  )}
                  {relativeTime && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      Last sync: {relativeTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: action icons + connect/disconnect */}
          <div className="flex items-center gap-1 shrink-0">
            {connected && (
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label={`${config.label} settings`}
                title="Settings (coming soon)"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
            <a
              href={config.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label={`Open ${config.label}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Connect / Disconnect button */}
        <div className="mt-4">
          {connected ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              disabled={isDisconnecting}
              onClick={() => disconnect(provider)}
            >
              <Plug className="h-3.5 w-3.5" />
              {isDisconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              disabled={isConnecting}
              onClick={() => connect(provider)}
            >
              <PlugZap className="h-3.5 w-3.5" />
              {isConnecting ? "Connecting…" : `Connect ${config.label}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
