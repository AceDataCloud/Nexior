import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { IApi, IApiDetailResponse, IApiListResponse } from './types';

class ApiService {
  key = 'apis';

  async getAll(): Promise<AxiosResponse<IApiListResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }

  async get(id: number): Promise<AxiosResponse<IApiDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IApi): Promise<AxiosResponse<IApiDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: number, data: IApi): Promise<AxiosResponse<IApiDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const serviceService = new ApiService();
