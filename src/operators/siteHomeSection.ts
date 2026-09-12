import type { AxiosResponse } from 'axios';
import type {
  ISiteHomeSection,
  ISiteHomeSectionCreateRequest,
  ISiteHomeSectionListResponse,
  ISiteHomeSectionUpdateRequest
} from '@/models';
import { anonymousHttpClient, httpClient } from './common';

interface ISiteHomeSectionQuery {
  site?: string;
  kind?: string;
  visible?: boolean;
  ordering?: string;
  offset?: number;
  limit?: number;
}

class SiteHomeSectionOperator {
  key = 'site-home-sections';

  async getAll(query?: ISiteHomeSectionQuery): Promise<AxiosResponse<ISiteHomeSectionListResponse>> {
    return await httpClient.get(`/${this.key}/`, { params: query });
  }

  async getPublic(origin: string, lang: string): Promise<AxiosResponse<ISiteHomeSection[]>> {
    return await anonymousHttpClient.get(`/${this.key}/public/`, { params: { origin, lang } });
  }

  async create(data: ISiteHomeSectionCreateRequest): Promise<AxiosResponse<ISiteHomeSection>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: ISiteHomeSectionUpdateRequest): Promise<AxiosResponse<ISiteHomeSection>> {
    return await httpClient.patch(`/${this.key}/${id}/`, data);
  }

  async delete(id: string): Promise<AxiosResponse<void>> {
    return await httpClient.delete(`/${this.key}/${id}/`);
  }
}

export const siteHomeSectionOperator = new SiteHomeSectionOperator();
