import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { getBaseUrlAuth } from '@/utils';
import { IConnectionListResponse, IConnectionRefreshResponse } from '@/models';

/**
 * Calls AuthBackend (auth.acedata.cloud) `/api/v1/connections/` directly.
 *
 * This is the unified, cross-consumer source of truth for OAuth
 * connections. Both the built-in providers (google / github / slack
 * / notion / linear / gitlab) and user-added custom MCP servers
 * (`kind: 'custom_oauth'`) are returned by the same endpoint.
 *
 * We piggy-back on the shared `httpClient` interceptor for the
 * `Authorization: Bearer <jwt>` header (Nexior already holds the
 * AuthBackend SSO token).
 */
class ConnectionOperator {
  private get baseURL(): string {
    return `${getBaseUrlAuth()}/api/v1`;
  }

  async list(): Promise<AxiosResponse<IConnectionListResponse>> {
    return httpClient.get('/connections/', { baseURL: this.baseURL });
  }

  async refresh(id: string): Promise<AxiosResponse<IConnectionRefreshResponse>> {
    return httpClient.post(`/connections/${id}/refresh/`, {}, { baseURL: this.baseURL });
  }
}

export const connectionOperator = new ConnectionOperator();
