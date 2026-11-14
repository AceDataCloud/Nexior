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
  async create(applicationId: string, credentialId: string, connectionIds: string[]): Promise<RuntimeGrant> {
    const { data } = await httpClient.post<RuntimeGrant>(
      '/connections/runtime-grants/',
      {
        application_id: applicationId,
        credential_id: credentialId,
        connection_ids: connectionIds,
        duration_seconds: 600
      },
      config()
    );
    return data;
  },
  async revoke(grantId: string): Promise<void> {
    await httpClient.delete(`/connections/runtime-grants/${encodeURIComponent(grantId)}/`, config());
  }
};
