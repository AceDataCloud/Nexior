import type { AxiosResponse } from 'axios';
import { httpClient } from './common';
import type { ISiteEmailTransportTestResponse } from '@/models/siteEmailTransportTest';
import { getBaseUrlAuth } from '@/utils';

const config = () => ({ baseURL: `${getBaseUrlAuth()}/api/v1` });

class SiteEmailTransportOperator {
  test(siteId: string): Promise<AxiosResponse<ISiteEmailTransportTestResponse>> {
    return httpClient.post(`/site-email-transports/${siteId}/test/`, undefined, config());
  }
}

export const siteEmailTransportOperator = new SiteEmailTransportOperator();
