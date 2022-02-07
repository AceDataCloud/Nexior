import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { IUserDetailResponse, IUser } from './types';

class UserService {
  key = 'users';

  async get(id: string | string[]): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.get(`/${this.key}/${id}`);
  }
}

export default new UserService();
