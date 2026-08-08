import { IService } from './service';

export interface IUsageCredential {
  id?: string;
  name?: string;
}

export interface IX402UsageMetadata extends Record<string, unknown> {
  x402?: boolean;
  x402_settlement_status?: 'settled' | 'unconfirmed';
  x402_list_amount_atomic?: string;
  x402_amount_atomic?: string;
  x402_discount_percent?: string;
  x402_discount_type?: 'Coin' | 'Manual';
  x402_discount_coin_policy_id?: string;
  x402_decimals?: number;
  x402_currency?: string;
  x402_network?: string;
  x402_tx?: string;
  x402_payer?: string;
  x402_settle_error?: string;
  x402_settle_attempt_tx?: string;
  x402_skipped?: boolean;
  request?: unknown;
  response?: unknown;
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
  metadata?: IX402UsageMetadata;
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
