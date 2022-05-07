import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { ICategory, ICategoryDetailResponse, ICategoryListResponse } from './types';

class CategoryService {
  key = 'categories';

  async getAll(): Promise<AxiosResponse<ICategoryListResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }

  async get(id: number): Promise<AxiosResponse<ICategoryDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: ICategory): Promise<AxiosResponse<ICategoryDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: number, data: ICategory): Promise<AxiosResponse<ICategoryDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const categoryService = new CategoryService();
