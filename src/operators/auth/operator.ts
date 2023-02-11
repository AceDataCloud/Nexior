import { AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { ITokenResponse, IToken } from './models';

class AuthOperator {
  async refreshToken(payload: IToken): Promise<AxiosResponse<ITokenResponse>> {
    return httpClient.post('/token/refresh/', payload);
  }
}

export const authOperator = new AuthOperator();
