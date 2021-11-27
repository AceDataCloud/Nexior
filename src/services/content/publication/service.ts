import { DEFAULT_LIMIT } from '@/settings/article';
import { AxiosResponse } from 'axios';
import httpClient from '../../instance';
import { IPublication, IPublicationDetailResponse, IPublicationListResponse, IPublicationCreateRequest } from './types';

class PublicationService {
  key = 'publications';

  async getAll(offset: number = 0, limit: number = DEFAULT_LIMIT): Promise<AxiosResponse<IPublicationListResponse>> {
    return await httpClient.get(`/${this.key}/?limit=${limit}&offset=${offset}`);
  }

  async get(id: number): Promise<AxiosResponse<IPublicationDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IPublicationCreateRequest): Promise<AxiosResponse<IPublicationDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: number, data: IPublication): Promise<AxiosResponse<IPublicationDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export default new PublicationService();
