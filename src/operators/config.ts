import { AxiosResponse } from 'axios';
import { anonymousHttpClient } from './common';
import { IConfigResponse } from '@/models';

class ConfigService {
  key = 'config';

  async get(): Promise<AxiosResponse<IConfigResponse>> {
    return await anonymousHttpClient.get(`/${this.key}/`);
  }
}

export const configOperator = new ConfigService();
