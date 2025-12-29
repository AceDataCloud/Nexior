import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IConfigResponse } from '@/models';

class ConfigService {
  key = 'config';

  async get(): Promise<AxiosResponse<IConfigResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }
}

export const configOperator = new ConfigService();
