import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { ISiteDomain, ISiteDomainDetailResponse, ISiteDomainListResponse } from '@/models';

export interface ISiteDomainQuery {
  site?: string;
  status?: string;
  hostname?: string;
  user_id?: string;
  offset?: number;
  limit?: number;
}

class SiteDomainService {
  key = 'site-domains';

  async getAll(query: ISiteDomainQuery = {}): Promise<AxiosResponse<ISiteDomainListResponse>> {
    return await httpClient.get(`/${this.key}/`, { params: query });
  }

  async get(id: string): Promise<AxiosResponse<ISiteDomainDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: { site: string; hostname: string }): Promise<AxiosResponse<ISiteDomainDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async verify(id: string): Promise<AxiosResponse<ISiteDomainDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/verify/`);
  }

  async delete(id: string): Promise<AxiosResponse<void>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const siteDomainOperator = new SiteDomainService();

export type { ISiteDomain };
