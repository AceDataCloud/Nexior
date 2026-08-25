import { BaseOperator } from '@acedatacloud/core/operators';
import { httpClient, optionalHttpClient } from './common';
import { IService, IServiceDetailResponse, IServiceListResponse } from '@/models';
import type { AxiosResponse } from 'axios';

export interface IServiceQuery {
  limit?: number;
  offset?: number;
  ordering?: string;
  id?: string | string[];
  type?: string | string[];
  private?: boolean;
}

class ServiceOperator extends BaseOperator<IService, IServiceListResponse, IServiceDetailResponse> {
  constructor() {
    super(httpClient, 'services');
  }

  override async getAll(query?: IServiceQuery): Promise<AxiosResponse<IServiceListResponse>> {
    return await optionalHttpClient.get(this.listUrl(), { params: query });
  }

  override async get(id: string): Promise<AxiosResponse<IServiceDetailResponse>> {
    return await optionalHttpClient.get(this.detailUrl(id));
  }
}

export const serviceOperator = new ServiceOperator();
