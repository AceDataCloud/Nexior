import { AxiosResponse } from 'axios';
import { anonymousHttpClient } from './common';
import { IExchangeRateRequest, IExchangeRateResponse } from '@/models';

class ExchangeOperator {
  async rate(payload: IExchangeRateRequest): Promise<AxiosResponse<IExchangeRateResponse>> {
    return anonymousHttpClient.post('/exchange-rate', payload);
  }
}

export const exchangeOperator = new ExchangeOperator();
