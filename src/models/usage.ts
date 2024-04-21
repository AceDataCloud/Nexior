import { IApi } from './api';
import { IService } from './service';

export interface IApiUsage {
  id?: string;
  api_id?: string;
  status_code?: number;
  trace_id?: string;
  created_at?: string;
  remaining_amount?: number;
  used_amount?: number;
  deducted_amount?: number;
  service?: IService;
}

export interface IApiUsageListResponse {
  count: number;
  items: IApiUsage[];
}

export type IApiUsageDetailResponse = IApiUsage;
