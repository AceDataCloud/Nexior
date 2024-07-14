export interface IExchangeRateRequest {
  source: string;
  target: string;
}

export interface IExchangeRateResponse {
  source: string;
  target: string;
  rate: number;
}
