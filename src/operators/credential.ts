import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { ICredential, ICredentialDetailResponse, ICredentialListResponse } from '@/models';

export interface ICredentialQuery {
  limit?: number;
  offset?: number;
  ordering?: string;
  user_id?: string;
  application_id?: string;
}

class CredentialOperator {
  key = 'credentials';

  async getAll(query: ICredentialQuery): Promise<AxiosResponse<ICredentialListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async get(id: string): Promise<AxiosResponse<ICredentialDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: ICredential): Promise<AxiosResponse<ICredentialDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const credentialOperator = new CredentialOperator();
