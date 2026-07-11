export interface IConfigFeatures {
  DISCOUNT_FOR_X402?: number;
  ENABLE_PAYPAL?: boolean;
  // Server-driven feature flags consumed via `isFeatureEnabled` (URL/cookie
  // opt-in / opt-out still wins).
  'auth-iframe'?: boolean;
  iframe?: boolean;
}

export interface IConfigResponse {
  features?: IConfigFeatures;
}
