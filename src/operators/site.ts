import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { ISite, ISiteDetailResponse, ISiteListResponse } from '@/models';

export interface ISiteQuery {
  origin?: string;
  offset?: number;
  limit?: number;
}

class SiteService {
  key = 'sites';

  async initialize(data: ISite): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await httpClient.post(`/${this.key}/initialize/`, data);
  }

  async getAll(query: ISiteQuery): Promise<AxiosResponse<ISiteListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async get(id: string): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: ISite): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: ISite): Promise<AxiosResponse<ISiteDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }
}

export const siteOperator = new SiteService();
