import apiClient from "@/lib/api";
import { handleApiError } from "@/types/apiError";
import type { ApiResponse } from "@/types/apiResponse";
import type {
  ConnectResponse,
  IntegrationListResponse,
} from "@/types/integration";

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
