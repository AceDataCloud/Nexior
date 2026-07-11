import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import {
  ISiteServiceOverrideCreateRequest,
  ISiteServiceOverrideDetailResponse,
  ISiteServiceOverrideListResponse,
  ISiteServiceOverrideUpdateRequest
} from '@/models';

export interface ISiteServiceOverrideQuery {
  site?: string;
  service?: string;
  visible?: boolean;
  ordering?: string;
  offset?: number;
  limit?: number;
}

class SiteServiceOverrideOperator {
  key = 'site-service-overrides';

  async getAll(query?: ISiteServiceOverrideQuery): Promise<AxiosResponse<ISiteServiceOverrideListResponse>> {
    return await httpClient.get(`/${this.key}/`, { params: query });
  }

  async get(id: string): Promise<AxiosResponse<ISiteServiceOverrideDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}/`);
  }

  async create(data: ISiteServiceOverrideCreateRequest): Promise<AxiosResponse<ISiteServiceOverrideDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  // PATCH (partial) so we only send the fields the dialog edited and never
  // clobber server-managed columns (site / service / *_source).
  async update(
    id: string,
    data: ISiteServiceOverrideUpdateRequest
  ): Promise<AxiosResponse<ISiteServiceOverrideDetailResponse>> {
    return await httpClient.patch(`/${this.key}/${id}/`, data);
  }

  async delete(id: string): Promise<AxiosResponse<void>> {
    return await httpClient.delete(`/${this.key}/${id}/`);
  }
}

export const siteServiceOverrideOperator = new SiteServiceOverrideOperator();
