import axios, { AxiosResponse } from 'axios';
import { IConnectorProvidersResponse, IConnectorListResponse } from '@/models';
import { BASE_URL_API } from '@/constants';

/**
 * Read-only proxy to the aichat2 worker's `/connectors` endpoint.
 * OAuth grant management has moved to AuthFrontend
 * (auth.acedata.cloud/user/connections); use
 * `openConnectionsManager()` from `@/utils/connections` to redirect
 * the user there instead of calling write actions here.
 */
class ConnectorOperator {
  private getHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async listProviders(token: string): Promise<AxiosResponse<IConnectorProvidersResponse>> {
    return await axios.post(
      '/aichat2/connectors',
      { action: 'list_providers' },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async list(token: string): Promise<AxiosResponse<IConnectorListResponse>> {
    return await axios.post(
      '/aichat2/connectors',
      { action: 'list' },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }
}

export const connectorOperator = new ConnectorOperator();
