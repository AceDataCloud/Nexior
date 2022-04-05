import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { ITokenResponse, IToken } from './types';

class AuthService {
  async refreshToken(payload: IToken): Promise<AxiosResponse<ITokenResponse>> {
    return httpClient.post('/token/refresh/', payload);
  }
}

export default new AuthService();
