import type { AxiosResponse } from 'axios';
import { httpClient } from './common';
import type {
  ISiteCapabilityOverrideCreateRequest,
  ISiteCapabilityOverrideDetailResponse,
  ISiteCapabilityOverrideListResponse,
  ISiteCapabilityOverrideUpdateRequest
} from '@/models';

export interface ISiteCapabilityOverrideQuery {
  site?: string;
  capability?: string;
  offset?: number;
  limit?: number;
}

class SiteCapabilityOverrideOperator {
  key = 'site-capability-overrides';

  async getAll(query?: ISiteCapabilityOverrideQuery): Promise<AxiosResponse<ISiteCapabilityOverrideListResponse>> {
    return await httpClient.get(`/${this.key}/`, { params: query });
  }

  async create(
    data: ISiteCapabilityOverrideCreateRequest
  ): Promise<AxiosResponse<ISiteCapabilityOverrideDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(
    id: string,
    data: ISiteCapabilityOverrideUpdateRequest
  ): Promise<AxiosResponse<ISiteCapabilityOverrideDetailResponse>> {
    return await httpClient.patch(`/${this.key}/${id}/`, data);
  }

  async delete(id: string): Promise<AxiosResponse<void>> {
    return await httpClient.delete(`/${this.key}/${id}/`);
  }
}

export const siteCapabilityOverrideOperator = new SiteCapabilityOverrideOperator();
