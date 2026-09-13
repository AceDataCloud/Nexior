import { AxiosResponse } from 'axios';
import { httpClient, optionalHttpClient } from './common';
import { ISite, ISiteDetailResponse, ISiteListResponse } from '@/models';

export interface ISiteQuery {
  origin?: string;
  origin__endswith?: string;
  user_id?: string;
  ordering?: string;
  offset?: number;
  limit?: number;
}

class SiteService {
  key = 'sites';

  async initialize(data: ISite): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await optionalHttpClient.post(`/${this.key}/initialize/`, data);
  }

  async getAll(query: ISiteQuery): Promise<AxiosResponse<ISiteListResponse>> {
    return await optionalHttpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async get(id: string): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await optionalHttpClient.get(`/${this.key}/${id}`);
  }

  async create(data: ISite): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(
    id: string,
    data: Partial<ISite>,
    configurationRevision?: number
  ): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await httpClient.patch(`/${this.key}/${id}`, data, {
      headers: configurationRevision === undefined ? undefined : { 'If-Match': String(configurationRevision) }
    });
  }

  async delete(id: string): Promise<AxiosResponse<void>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const siteOperator = new SiteService();
