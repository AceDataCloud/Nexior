import { AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { IProxy, IProxyDetailResponse, IProxyListResponse } from '../proxy/models';

export interface IProxyQuery {
  limit?: number;
  offset?: number;
  ordering?: string;
}

class ProxyOperator {
  key = 'proxies';

  async getAll(query: IProxyQuery): Promise<AxiosResponse<IProxyListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async get(id: string): Promise<AxiosResponse<IProxyDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IProxy): Promise<AxiosResponse<IProxyDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: IProxy): Promise<AxiosResponse<IProxyDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }

  async getAllForService(serviceId: string, query: IProxyQuery): Promise<AxiosResponse<IProxyListResponse>> {
    return await httpClient.get(`/services/${serviceId}/${this.key}/`, {
      params: query
    });
  }
}

export const proxyOperator = new ProxyOperator();
