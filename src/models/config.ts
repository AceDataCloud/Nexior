export interface IConfigFeatures {
  DISCOUNT_FOR_X402?: number;
  ENABLE_PAYPAL?: boolean;
  // Card visibility and the active hosted-checkout route are independent
  // rollout controls returned by the platform config endpoint.
  ENABLE_CARD?: boolean;
  airwallex?: boolean;
  STUDIO_CLAUDE_OPUS_5_5_EARLY_ACCESS?: boolean;
}

export interface IConfigResponse {
  features?: IConfigFeatures;
}
