export interface IConfigFeatures {
  DISCOUNT_FOR_X402?: number;
  ENABLE_PAYPAL?: boolean;
  ENABLE_COINGATE?: boolean;
}

export interface IConfigResponse {
  features?: IConfigFeatures;
}
