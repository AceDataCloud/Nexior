import { AxiosResponse } from 'axios';
import { BaseOperator } from '@acedatacloud/core/operators';
import { httpClient, optionalHttpClient } from './common';
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

  override async getAll(query?: IApiQuery): Promise<AxiosResponse<IApiListResponse>> {
    return await optionalHttpClient.get(this.listUrl(), { params: query });
  }

  override async get(id: string): Promise<AxiosResponse<IApiDetailResponse>> {
    return await optionalHttpClient.get(this.detailUrl(id));
  }

  async getAllForService(serviceId: string, query?: IApiQuery): Promise<AxiosResponse<IApiListResponse>> {
    return await optionalHttpClient.get(`/services/${serviceId}/${this.key}/`, {
      params: query
    });
  }
}

export const apiOperator = new ApiOperator();
