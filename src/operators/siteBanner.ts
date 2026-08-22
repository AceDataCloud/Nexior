import type { AxiosResponse } from 'axios';
import { httpClient } from './common';
import type {
  ISiteBanner,
  ISiteBannerCreateRequest,
  ISiteBannerDetailResponse,
  ISiteBannerListResponse,
  ISiteBannerUpdateRequest
} from '@/models';

export interface ISiteBannerQuery {
  site?: string;
  visible?: boolean;
  ordering?: string;
  offset?: number;
  limit?: number;
}

class SiteBannerOperator {
  key = 'site-banners';

  async getAll(query?: ISiteBannerQuery): Promise<AxiosResponse<ISiteBannerListResponse>> {
    return await httpClient.get(`/${this.key}/`, { params: query });
  }

  async getPublic(origin: string): Promise<AxiosResponse<ISiteBanner[]>> {
    return await httpClient.get(`/${this.key}/public/`, { params: { origin } });
  }

  async create(data: ISiteBannerCreateRequest): Promise<AxiosResponse<ISiteBannerDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: ISiteBannerUpdateRequest): Promise<AxiosResponse<ISiteBannerDetailResponse>> {
    return await httpClient.patch(`/${this.key}/${id}/`, data);
  }

  async delete(id: string): Promise<AxiosResponse<void>> {
    return await httpClient.delete(`/${this.key}/${id}/`);
  }
}

export const siteBannerOperator = new SiteBannerOperator();
