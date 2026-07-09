import { IService } from './service';

export interface IUsageCredential {
  id?: string;
  name?: string;
}

export interface IApiUsage {
  id?: string;
  api_id?: string;
  credential_id?: string;
  credential?: IUsageCredential;
  status_code?: number;
  elapsed?: number;
  trace_id?: string;
  created_at?: string;
  remaining_amount?: number;
  used_amount?: number;
  deducted_amount?: number;
  original_amount?: number;
  metadata?: Record<string, any>;
  service?: IService;
}

export interface IApiUsageListResponse {
  count: number;
  items: IApiUsage[];
}

export type IApiUsageDetailResponse = IApiUsage;

export interface IProxyUsage {
  id?: string;
  proxy_id?: string;
  credential_id?: string;
  credential?: IUsageCredential;
  elapsed?: number;
  trace_id?: string;
  created_at?: string;
  remaining_amount?: number;
  used_amount?: number;
  deducted_amount?: number;
  original_amount?: number;
  metadata?: Record<string, any>;
  service?: IService;
}

export interface IProxyUsageListResponse {
  count: number;
  items: IProxyUsage[];
}
