import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { ISite, ISiteDetailResponse, ISiteListResponse } from '@/models';

export interface ISiteQuery {
  origin?: string;
  origin__endswith?: string;
  user_id?: string;
  ordering?: string;
  offset?: number;
  limit?: number;
}

const canUseLegacySiteApi = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404 || status === 405;
};

class SiteService {
  key = 'sites';

  async resolvePublic(origin: string): Promise<AxiosResponse<ISiteDetailResponse>> {
    try {
      return await httpClient.get(`/${this.key}/resolve`, { params: { origin } });
    } catch (error) {
      if (!canUseLegacySiteApi(error)) throw error;
      const response = await this.getAll({ origin });
      return { ...response, data: response.data.items?.[0] } as AxiosResponse<ISiteDetailResponse>;
    }
  }

  async getManaged(query?: ISiteQuery): Promise<AxiosResponse<ISiteListResponse>> {
    try {
      return await httpClient.get(`/${this.key}/managed`, { params: query });
    } catch (error) {
      if (!canUseLegacySiteApi(error)) throw error;
      return await this.getAll(query || {});
    }
  }

  async getManagedCurrent(origin: string): Promise<AxiosResponse<ISiteDetailResponse>> {
    try {
      return await httpClient.get(`/${this.key}/managed/current`, { params: { origin } });
    } catch (error) {
      if (!canUseLegacySiteApi(error)) throw error;
      const response = await this.getAll({ origin });
      return { ...response, data: response.data.items?.[0] } as AxiosResponse<ISiteDetailResponse>;
    }
  }

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

  async delete(id: string): Promise<AxiosResponse<void>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const siteOperator = new SiteService();
