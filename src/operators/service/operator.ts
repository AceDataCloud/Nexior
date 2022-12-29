import { AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { IService, IServiceDetailResponse, IServiceListResponse } from './models';

class ServiceOperator {
  key = 'services';

  async getAll(): Promise<AxiosResponse<IServiceListResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }

  async get(id: number): Promise<AxiosResponse<IServiceDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IService): Promise<AxiosResponse<IServiceDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: number, data: IService): Promise<AxiosResponse<IServiceDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const serviceOperator = new ServiceOperator();
