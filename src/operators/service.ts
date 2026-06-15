import { BaseOperator } from '@acedatacloud/core/operators';
import { httpClient } from './common';
import { IService, IServiceDetailResponse, IServiceListResponse } from '@/models';

export interface IServiceQuery {
  limit?: number;
  offset?: number;
  ordering?: string;
  id?: string | string[];
}

class ServiceOperator extends BaseOperator<IService, IServiceListResponse, IServiceDetailResponse> {
  constructor() {
    super(httpClient, 'services');
  }
}

export const serviceOperator = new ServiceOperator();
