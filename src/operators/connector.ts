import axios, { AxiosResponse } from 'axios';
import {
  IConnectorProvidersResponse,
  IConnectorListResponse,
  IConnectorAuthorizeResponse,
  IConnectorExchangeResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';

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

  async authorize(provider: string, token: string): Promise<AxiosResponse<IConnectorAuthorizeResponse>> {
    return await axios.post(
      '/aichat2/connectors',
      { action: 'authorize', provider },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async exchange(code: string, state: string, token: string): Promise<AxiosResponse<IConnectorExchangeResponse>> {
    return await axios.post(
      '/aichat2/connectors',
      { action: 'exchange', code, state },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async disconnect(provider: string, token: string): Promise<AxiosResponse<{ success: boolean }>> {
    return await axios.post(
      '/aichat2/connectors',
      { action: 'disconnect', provider },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async toggle(provider: string, isEnabled: boolean, token: string): Promise<AxiosResponse<{ success: boolean }>> {
    return await axios.post(
      '/aichat2/connectors',
      { action: 'toggle', provider, is_enabled: isEnabled },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }
}

export const connectorOperator = new ConnectorOperator();
