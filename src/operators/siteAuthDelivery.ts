import type { AxiosResponse } from 'axios';
import { httpClient } from './common';
import type { ISiteAuthDeliveryTestResponse, ISitePhoneDeliveryTestRequest } from '@/models/site';
import { getBaseUrlAuth } from '@/utils';

const authConfig = () => ({ baseURL: `${getBaseUrlAuth()}/api/v1` });

class SiteAuthDeliveryOperator {
  testEmail(siteId: string): Promise<AxiosResponse<ISiteAuthDeliveryTestResponse>> {
    return httpClient.post(`/site-auth-deliveries/${siteId}/email/test/`, undefined, authConfig());
  }

  testPhone(
    siteId: string,
    payload: ISitePhoneDeliveryTestRequest
  ): Promise<AxiosResponse<ISiteAuthDeliveryTestResponse>> {
    return httpClient.post(`/site-auth-deliveries/${siteId}/phone/test/`, payload, authConfig());
  }
}

export const siteAuthDeliveryOperator = new SiteAuthDeliveryOperator();
