import type { AxiosResponse } from 'axios';
import { httpClient } from './common';
import type {
  ISiteAuthDelivery,
  ISiteAuthDeliveryProviders,
  ISiteAuthDeliveryTestResponse,
  ISitePhoneDeliveryTestRequest
} from '@/models/site';
import { getBaseUrlAuth } from '@/utils';

const authConfig = () => ({ baseURL: `${getBaseUrlAuth()}/api/v1` });

class SiteAuthDeliveryOperator {
  get(siteId: string): Promise<AxiosResponse<{ providers: ISiteAuthDeliveryProviders }>> {
    return httpClient.get(`/sites/${siteId}/auth-deliveries/`);
  }

  update(
    siteId: string,
    provider: 'email' | 'phone',
    delivery: ISiteAuthDelivery
  ): Promise<AxiosResponse<ISiteAuthDelivery>> {
    return httpClient.patch(`/sites/${siteId}/auth-deliveries/${provider}/`, { delivery });
  }

  remove(siteId: string, provider: 'email' | 'phone'): Promise<AxiosResponse<void>> {
    return httpClient.delete(`/sites/${siteId}/auth-deliveries/${provider}/`);
  }

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
