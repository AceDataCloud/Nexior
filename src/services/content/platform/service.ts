import { AxiosResponse } from 'axios';
import httpClient from '../../instance';
import { IPlatform, IPlatformDetailResponse, IPlatformListResponse } from './types';

class PlatformService {
  key = 'platforms';

  async getAll(): Promise<AxiosResponse<IPlatformListResponse>> {
    return await httpClient.get(`/${this.key}`);
  }

  async get(id: number): Promise<AxiosResponse<IPlatformDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IPlatform): Promise<AxiosResponse<IPlatformDetailResponse>> {
    return await httpClient.post(`/${this.key}`, data);
  }

  async update(id: number, data: IPlatform): Promise<AxiosResponse<IPlatformDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export default new PlatformService();
