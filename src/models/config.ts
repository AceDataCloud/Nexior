export interface IConfigFeatures {
  DISCOUNT_FOR_X402?: number;
  ENABLE_PAYPAL?: boolean;
  // When on, the Card pay-way (hosted Stripe PaymentLink, HK account)
  // replaces Stripe in the payment picker.
  ENABLE_CARD?: boolean;
}

export interface IConfigResponse {
  features?: IConfigFeatures;
}
