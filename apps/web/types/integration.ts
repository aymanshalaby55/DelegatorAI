export interface IntegrationInfo {
  provider: string;
  connected: boolean;
  connected_at: string | null;
  metadata: Record<string, string>;
}

export interface IntegrationListResponse {
  integrations: IntegrationInfo[];
}

export interface ConnectResponse {
  url: string;
}
