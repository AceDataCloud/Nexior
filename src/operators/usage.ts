import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IApiUsageDetailResponse, IApiUsageListResponse } from '@/models';

export interface IApiUsageQuery {
  user_id?: string;
  offset?: number;
  limit?: number;
  application_id?: string | string[];
  ordering?: string;
}

class ApiUsageOperator {
  key = 'usage/apis';

  async getAll(query: IApiUsageQuery): Promise<AxiosResponse<IApiUsageListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async get(id: string): Promise<AxiosResponse<IApiUsageDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }
}

export const apiUsageOperator = new ApiUsageOperator();
