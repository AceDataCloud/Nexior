import { AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { IApplication, IApplicationDetailResponse, IApplicationListResponse } from './models';
import { camelizeKeys, decamelizeKeys } from 'humps';

export interface IApplicationQuery {
  userId: string;
}

class ApplicationOperator {
  key = 'applications';

  async getAll(query: IApplicationQuery): Promise<AxiosResponse<IApplicationListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: decamelizeKeys(query)
    });
  }

  async get(id: string): Promise<AxiosResponse<IApplicationDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IApplication): Promise<AxiosResponse<IApplicationDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: IApplication): Promise<AxiosResponse<IApplicationDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const applicationOperator = new ApplicationOperator();
