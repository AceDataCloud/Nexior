import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IExchangeRateRequest, IExchangeRateResponse } from '@/models';

class ExchangeOperator {
  async rate(payload: IExchangeRateRequest): Promise<AxiosResponse<IExchangeRateResponse>> {
    return httpClient.post('/exchange-rate', payload);
  }
}

export const exchangeOperator = new ExchangeOperator();
