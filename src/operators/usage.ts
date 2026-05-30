import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IApiUsageDetailResponse, IApiUsageListResponse, IProxyUsageListResponse } from '@/models';

export interface IApiUsageQuery {
  user_id?: string;
  offset?: number;
  limit?: number;
  application_id?: string | string[];
  api_id?: string | string[];
  ordering?: string;
  created_at_from?: string | Date;
  created_at_to?: string | Date;
  status_code?: number | string | (number | string)[];
}

class ApiUsageOperator {
  key = 'usage/apis';

  async getAll(query: IApiUsageQuery): Promise<AxiosResponse<IApiUsageListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async getAggregate(query: {
    user_id?: string;
    application_id?: string | string[];
    api_id?: string | string[];
    created_at_from?: string | Date;
    created_at_to?: string | Date;
  }): Promise<
    AxiosResponse<{
      total: number;
      items: { date: string; api_id: string; amount: number }[];
      apis: Record<string, { title: string }>;
    }>
  > {
    return await httpClient.get(`/${this.key}/aggregate/`, { params: query });
  }

  async get(id: string): Promise<AxiosResponse<IApiUsageDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async getStatusCodes(query: {
    user_id?: string;
    application_id?: string | string[];
    api_id?: string | string[];
    created_at_from?: string | Date;
    created_at_to?: string | Date;
  }): Promise<AxiosResponse<{ items: number[] }>> {
    return await httpClient.get(`/${this.key}/status-codes/`, { params: query });
  }

  async exportCsv(query: Partial<IApiUsageQuery>): Promise<AxiosResponse<Blob>> {
    return await httpClient.get(`/${this.key}/export/`, {
      params: query,
      responseType: 'blob'
    });
  }
}

export const apiUsageOperator = new ApiUsageOperator();

export interface IProxyUsageQuery {
  user_id?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
  application_id?: string | string[];
}

class ProxyUsageOperator {
  key = 'usage/proxies';

  async getAll(query: IProxyUsageQuery): Promise<AxiosResponse<IProxyUsageListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }
}

export const proxyUsageOperator = new ProxyUsageOperator();
