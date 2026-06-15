import { AxiosResponse } from 'axios';
import { BaseOperator } from '@acedatacloud/core/operators';
import { httpClient } from './common';
import { IApi, IApiDetailResponse, IApiListResponse } from '@/models';

export interface IApiQuery {
  limit?: number;
  offset?: number;
  ordering?: string;
}

class ApiOperator extends BaseOperator<IApi, IApiListResponse, IApiDetailResponse> {
  constructor() {
    super(httpClient, 'apis');
  }

  async getAllForService(serviceId: string, query?: IApiQuery): Promise<AxiosResponse<IApiListResponse>> {
    return await httpClient.get(`/services/${serviceId}/${this.key}/`, {
      params: query
    });
  }
}

export const apiOperator = new ApiOperator();
