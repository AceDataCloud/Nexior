import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IUserDetailResponse, IUser, IUserListResponse, IUserPublic } from '@/models';

export interface IInviteesQuery {
  offset?: number;
  limit?: number;
  ordering?: string;
}

export interface IUserResolveQuery {
  id?: string;
  email?: string;
  phone?: string;
  username?: string;
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

  async resolve(query: IUserResolveQuery): Promise<AxiosResponse<IUserPublic>> {
    const params: Record<string, string> = {};
    (Object.keys(query) as Array<keyof IUserResolveQuery>).forEach((key) => {
      const value = query[key];
      if (value) {
        params[key] = value;
      }
    });
    return httpClient.get('/users/resolve', { params });
  }
}

export const userOperator = new UserOperator();
