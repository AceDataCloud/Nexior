import { AxiosResponse } from 'axios';
import { httpClient } from './common';

export interface IAppVersionResponse {
  app: string;
  platform: string;
  latest: string;
  min_supported: string;
  store_url: string;
  message: string;
}

class AppVersionOperator {
  async get(app: string, platform: string): Promise<AxiosResponse<IAppVersionResponse>> {
    return httpClient.get('/app-version/', {
      params: { app, platform },
      timeout: 5000
    });
  }
}

export const appVersionOperator = new AppVersionOperator();
