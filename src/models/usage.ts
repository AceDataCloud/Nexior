import { IApi } from './api';

export interface IApiUsage {
  id?: string;
  api?: IApi;
  api_id?: string;
  application_id?: string;
  trace_id?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface IApiUsageListResponse {
  count: number;
  items: IApiUsage[];
}

export type IApiUsageDetailResponse = IApiUsage;
