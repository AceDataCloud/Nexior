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
    return httpClient.get('/me');
  }

  async getInvitees(query: IInviteesQuery): Promise<AxiosResponse<IUserListResponse>> {
    return httpClient.get('/me/invitees', {
      params: query
    });
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
