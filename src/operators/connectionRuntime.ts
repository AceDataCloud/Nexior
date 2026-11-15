import { httpClient } from './common';
import { getBaseUrlAuth } from '@/utils/baseUrl';

const config = () => ({ baseURL: `${getBaseUrlAuth()}/api/v1` });
export interface RuntimeConnectionOption {
  connection_id: string;
  connector_identifier: string;
  label: string;
  permissions: string[];
}
export interface RuntimeGrant {
  grant_id: string;
  ticket: string;
  expires_at: string;
}
export const connectionRuntime = {
  async options(): Promise<RuntimeConnectionOption[]> {
    const { data } = await httpClient.get<{
      connections: Array<
        Omit<RuntimeConnectionOption, 'permissions'> & {
          runtime_auth: { routes: Array<{ method: string; origin: string; path_prefix: string }> };
        }
      >;
    }>('/connections/runtime-options/', config());
    return data.connections.map((c) => ({
      ...c,
      permissions: c.runtime_auth.routes.map((r) => `${r.method} ${new URL(r.origin).hostname}${r.path_prefix}`)
    }));
  },
  async create(modelToken: string, connectionIds: string[], expiresAt?: string): Promise<RuntimeGrant> {
    // Bind the ticket to this execution credential without resolving billing IDs
    // or sending the raw model token to Auth.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(modelToken));
    const executionBinding = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const { data } = await httpClient.post<RuntimeGrant>(
      '/connections/runtime-grants/',
      {
        execution_binding: executionBinding,
        connection_ids: connectionIds,
        duration_seconds: 600,
        ...(expiresAt ? { expires_at: expiresAt } : {})
      },
      config()
    );
    return data;
  },
  async revoke(grantId: string): Promise<void> {
    await httpClient.delete(`/connections/runtime-grants/${encodeURIComponent(grantId)}/`, config());
  }
};
