import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { getBaseUrlAuth } from '@/utils';

export interface ISmsWebhookTestRequest {
  webhook_url: string;
  webhook_secret: string;
  site?: string;
  region?: string;
  receiver?: string;
  locale?: string;
}

export interface ISmsWebhookTestResponse {
  success: boolean;
  message?: string;
}

// The dry-run test endpoint lives on AuthBackend (which owns the SMS delivery
// + signing), not the platform Site API — so override the base URL to auth,
// same idiom as the SSO token operator. The shared httpClient injects the
// user's JWT (Authorization), which the endpoint requires.
class SmsWebhookOperator {
  async test(payload: ISmsWebhookTestRequest): Promise<AxiosResponse<ISmsWebhookTestResponse>> {
    return httpClient.post('/sms-webhook-test/', payload, {
      baseURL: `${getBaseUrlAuth()}/api/v1`
    });
  }
}

export const smsWebhookOperator = new SmsWebhookOperator();
