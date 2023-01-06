import { AxiosResponse } from 'axios';
import { decamelizeKeys } from 'humps';
import { httpClient } from '../instance';
import { IApi, IApiDetailResponse, IApiListResponse } from '../api/models';

export interface IApiQuery {
  limit: number;
  offset: number;
}

class ApiOperator {
  key = 'apis';

  async getAll(query: IApiQuery): Promise<AxiosResponse<IApiListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: decamelizeKeys(query)
    });
  }

  async get(id: string): Promise<AxiosResponse<IApiDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IApi): Promise<AxiosResponse<IApiDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: IApi): Promise<AxiosResponse<IApiDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }

  async getAllForService(serviceId: string): Promise<AxiosResponse<IApiListResponse>> {
    return await httpClient.get(`/services/${serviceId}/${this.key}/`);
  }
}

export const apiOperator = new ApiOperator();
