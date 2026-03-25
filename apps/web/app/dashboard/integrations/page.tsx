"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Puzzle } from "lucide-react";
import { useIntegrations } from "@/hooks/useIntegrations";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { IntegrationCardSkeleton } from "@/components/integrations/IntegrationCardSkeleton";

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const {
    data: integrations = [],
    isLoading,
    isError,
    error,
  } = useIntegrations();

  // Show a toast when redirected back from an OAuth callback
  useEffect(() => {
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");
    const label = provider
      ? provider.charAt(0).toUpperCase() + provider.slice(1)
      : "Integration";

    if (status === "success") toast.success(`${label} connected successfully!`);
    else if (status === "error")
      toast.error(`Failed to connect ${label}. Please try again.`);
  }, [searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-8 max-w-4xl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Puzzle className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Integrations
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your tools to push tasks, share summaries, and automate
          workflows.
        </p>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
          Failed to load integrations: {error?.message ?? "Unknown error"}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <IntegrationCardSkeleton key={i} />
            ))
          : integrations.map((integration) => (
              <IntegrationCard
                key={integration.provider}
                integration={integration}
              />
            ))}
      </div>
    </motion.div>
  );
}
