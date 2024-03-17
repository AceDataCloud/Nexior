import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { ITokenResponse, IToken, IOAuthTokenRequest, IOAuthTokenResponse } from '@/models';
import { getBaseUrlAuth } from '@/utils';

class AuthOperator {
  async refreshToken(payload: IToken): Promise<AxiosResponse<ITokenResponse>> {
    return httpClient.post('/auth/refresh/', payload);
  }
}

class OAuthOperator {
  async token(payload: IOAuthTokenRequest): Promise<AxiosResponse<IOAuthTokenResponse>> {
    return httpClient.post('/token', payload, {
      baseURL: `${getBaseUrlAuth()}/oauth2/v1`
    });
  }
}

export const authOperator = new AuthOperator();
export const oauthOperator = new OAuthOperator();
