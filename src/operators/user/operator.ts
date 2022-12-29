import { AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { IUserDetailResponse, IUser } from './models';

class UserOperator {
  async getMe(): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.get('/me');
  }

  async updateMe(data: IUser): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.put('/me', data);
  }

  async getVerify(): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.get('/verify');
  }

  async updateVerify(data: IUser): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.put('/verify', data);
  }
}

export const userOperator = new UserOperator();
