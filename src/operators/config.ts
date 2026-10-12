import { getX402FeatureHeaders } from '@/utils/x402/featureGate';
import { AxiosResponse } from 'axios';
import { anonymousHttpClient } from './common';
import { IConfigResponse } from '@/models';

class ConfigService {
  key = 'config';

  async get(): Promise<AxiosResponse<IConfigResponse>> {
    return await anonymousHttpClient.get(`/${this.key}/`, { headers: getX402FeatureHeaders() });
  }
}

export const configOperator = new ConfigService();
