import apiClient from "@/lib/api";
import { handleApiError } from "@/types/apiError";
import type { ApiResponse } from "@/types/apiResponse";
import type {
  ConnectResponse,
  IntegrationListResponse,
} from "@/types/integration";

export interface GitHubRepo {
  full_name: string;
  private: boolean;
}

export interface GitHubCollaborator {
  login: string;
  avatar_url: string;
  type: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
}

async function parseResponse<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<ApiResponse<T>> {
  const response = await promise;
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data;
}

export async function getIntegrations(): Promise<
  ApiResponse<IntegrationListResponse>
> {
  try {
    return await parseResponse(apiClient.get("/integrations/"));
  } catch (error) {
    handleApiError(error);
  }
}

export async function connectIntegration(
  provider: string,
): Promise<ApiResponse<ConnectResponse>> {
  try {
    return await parseResponse(
      apiClient.get(`/integrations/connect/${provider}`),
    );
  } catch (error) {
    handleApiError(error);
  }
}

export async function disconnectIntegration(
  provider: string,
): Promise<ApiResponse<null>> {
  try {
    return await parseResponse(
      apiClient.delete(`/integrations/${provider}`),
    );
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateIntegrationSettings(
  provider: string,
  metadata: Record<string, string>,
): Promise<ApiResponse<{ metadata: Record<string, string> }>> {
  try {
    return await parseResponse(
      apiClient.patch(`/integrations/${provider}/settings`, { metadata }),
    );
  } catch (error) {
    handleApiError(error);
  }
}

export async function getGitHubRepos(): Promise<
  ApiResponse<{ repos: GitHubRepo[] }>
> {
  try {
    return await parseResponse(apiClient.get("/integrations/github/repos"));
  } catch (error) {
    handleApiError(error);
  }
}

export async function getSlackChannels(): Promise<
  ApiResponse<{ channels: SlackChannel[] }>
> {
  try {
    return await parseResponse(apiClient.get("/integrations/slack/channels"));
  } catch (error) {
    handleApiError(error);
  }
}

export async function getGitHubCollaborators(
  repo: string,
): Promise<ApiResponse<{ collaborators: GitHubCollaborator[] }>> {
  try {
    return await parseResponse(
      apiClient.get("/integrations/github/collaborators", { params: { repo } }),
    );
  } catch (error) {
    handleApiError(error);
  }
}
