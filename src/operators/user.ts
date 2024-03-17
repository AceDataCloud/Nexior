import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IUserDetailResponse, IUser, IUserListResponse } from '@/models';

export interface IInviteesQuery {
  offset?: number;
  limit?: number;
  ordering?: string;
}

class UserOperator {
  async getMe(): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.get('/users/me');
  }

  async getInvitees(query: IInviteesQuery): Promise<AxiosResponse<IUserListResponse>> {
    return httpClient.get('/users/me/invitees', {
      params: query
    });
  }

  async updateMe(data: IUser): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.put('/users/me', data);
  }

  async getVerify(): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.get('/users/verify');
  }

  async updateVerify(data: IUser): Promise<AxiosResponse<IUserDetailResponse>> {
    return httpClient.put('/users/verify', data);
  }
}

export const userOperator = new UserOperator();
