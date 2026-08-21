import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IAuthCodeResponse, ITokenResponse, IToken, IOAuthTokenRequest, IOAuthTokenResponse } from '@/models';
import { getBaseUrlAuth } from '@/utils';

class AuthOperator {
  async refreshToken(payload: IToken): Promise<AxiosResponse<ITokenResponse>> {
    return httpClient.post('/auth/refresh/', payload);
  }

  async getCode(): Promise<AxiosResponse<IAuthCodeResponse>> {
    return httpClient.post('/auth/code/', {});
  }
}

class SSOOperator {
  async token(payload: IOAuthTokenRequest): Promise<AxiosResponse<IOAuthTokenResponse>> {
    return httpClient.post('/token', payload, {
      baseURL: `${getBaseUrlAuth()}/sso/v1`
    });
  }
}

export const authOperator = new AuthOperator();
export const ssoOperator = new SSOOperator();
