"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  updateIntegrationSettings,
  getGitHubRepos,
  getSlackChannels,
  getGitHubCollaborators,
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

export function useUpdateIntegrationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
      metadata,
    }: {
      provider: string;
      metadata: Record<string, string>;
    }) => updateIntegrationSettings(provider, metadata),
    onSuccess: (_, { provider }) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
      toast.success(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} settings saved`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });
}

export function useGitHubRepos(enabled: boolean) {
  return useQuery({
    queryKey: ["integrations", "github", "repos"],
    queryFn: getGitHubRepos,
    select: (res) => res.data?.repos ?? [],
    enabled,
  });
}

export function useSlackChannels(enabled: boolean) {
  return useQuery({
    queryKey: ["integrations", "slack", "channels"],
    queryFn: getSlackChannels,
    select: (res) => res.data?.channels ?? [],
    enabled,
  });
}

export function useGitHubCollaborators(repo: string, enabled: boolean) {
  return useQuery({
    queryKey: ["integrations", "github", "collaborators", repo],
    queryFn: () => getGitHubCollaborators(repo),
    select: (res) => res.data?.collaborators ?? [],
    enabled: enabled && !!repo,
    staleTime: 5 * 60 * 1000,
  });
}
