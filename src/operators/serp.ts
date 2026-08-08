import axios, { AxiosResponse } from 'axios';
import { ISerpConfig, ISerpSearchRequest, ISerpSearchResponse } from '@/models';
import { BASE_URL_API } from '@/constants';
import { postWithX402, quoteX402, type OperatorRequestOptions } from './x402';

const HEADERS = { 'content-type': 'application/json', accept: 'application/json' };

export function buildSerpRequest(config?: ISerpConfig): ISerpSearchRequest {
  return {
    query: config?.query?.trim(),
    type: config?.type,
    number: config?.number,
    page: config?.page,
    country: config?.country,
    language: config?.language,
    range: config?.range
  };
}

class SerpOperator {
  async quote(data: ISerpSearchRequest) {
    return quoteX402('/serp/google', data, HEADERS);
  }

  async search(data: ISerpSearchRequest, options: OperatorRequestOptions): Promise<AxiosResponse<ISerpSearchResponse>> {
    if (options.mode === 'x402') {
      if (!options.x402) throw new Error('x402 payment options are required');
      return postWithX402<ISerpSearchResponse>('/serp/google', data, options.x402, HEADERS);
    }
    return axios.post('/serp/google', data, {
      headers: { ...HEADERS, authorization: `Bearer ${options.token}` },
      baseURL: BASE_URL_API
    });
  }
}

export const serpOperator = new SerpOperator();
