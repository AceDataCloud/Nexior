export interface IConfigFeatures {
  DISCOUNT_FOR_X402?: number;
  ENABLE_PAYPAL?: boolean;
  CN_FOREIGN_CHAT_RESTRICTION?: boolean;
}

export interface IConfigResponse {
  features?: IConfigFeatures;
  country?: string | null;
}
