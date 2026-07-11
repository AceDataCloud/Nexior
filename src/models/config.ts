export interface IConfigFeatures {
  DISCOUNT_FOR_X402?: number;
  ENABLE_PAYPAL?: boolean;
}

export interface IConfigResponse {
  features?: IConfigFeatures;
}
