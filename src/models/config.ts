export interface IConfigFeatures {
  DISCOUNT_FOR_X402?: number;
  ENABLE_PAYPAL?: boolean;
  // Card visibility and the active hosted-checkout route are independent
  // rollout controls returned by the platform config endpoint.
  ENABLE_CARD?: boolean;
  airwallex?: boolean;
}

export interface IEarlyAccessModelConfig {
  eligible: boolean;
  phase: 'disabled' | 'scheduled' | 'holder_access' | 'general_availability';
  reason: string;
  starts_at?: string;
  ga_at?: string;
  minimum_ace_tier: number;
  current_ace_tier: number;
  attribution_key?: string;
}

export interface IConfigResponse {
  features?: IConfigFeatures;
  early_access?: Record<string, IEarlyAccessModelConfig>;
  server_time?: string;
  client_received_at?: number;
}
