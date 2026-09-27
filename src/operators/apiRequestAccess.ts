import type { AxiosResponse } from 'axios';
import { httpClient } from './common';

export interface IRequestAccessResult {
  allowed: boolean;
  restricted: boolean;
  minimum_ace_tier?: number;
  opens_at?: string;
  message?: string;
}

export class ApiRequestAccessOperator {
  async evaluate(
    apiId: string,
    payloads: Record<string, Record<string, unknown>>
  ): Promise<AxiosResponse<{ results: Record<string, IRequestAccessResult> }>> {
    return httpClient.post('/api-request-access/eligibility/', { api_id: apiId, payloads });
  }
}

export const apiRequestAccessOperator = new ApiRequestAccessOperator();
