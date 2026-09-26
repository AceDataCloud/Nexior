import { AxiosResponse } from 'axios';
import { optionalHttpClient } from './common';
import { IConfigResponse } from '@/models';

class ConfigService {
  key = 'config';

  async get(): Promise<AxiosResponse<IConfigResponse>> {
    return await optionalHttpClient.get(`/${this.key}/`);
  }
}

export const configOperator = new ConfigService();
