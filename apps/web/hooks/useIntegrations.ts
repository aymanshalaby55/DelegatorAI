"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
} from "@/services/integration-service";

export const integrationKeys = {
  all: ["integrations"] as const,
};

export function useIntegrations() {
  return useQuery({
    queryKey: integrationKeys.all,
    queryFn: getIntegrations,
    select: (res) => res.data?.integrations ?? [],
  });
}

export function useConnectIntegration() {
  return useMutation({
    mutationFn: (provider: string) => connectIntegration(provider),
    onSuccess: (response) => {
      const url = response?.data?.url;
      if (url) {
        window.location.href = url;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start OAuth flow");
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => disconnectIntegration(provider),
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
      toast.success(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected successfully`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disconnect integration");
    },
  });
}
