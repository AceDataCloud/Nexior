import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { IDocument, IDocumentDetailResponse, IDocumentListResponse } from './models';

export interface IDocumentQuery {
  limit: number;
  offset: number;
  ordering: string;
  private: boolean;
}

class DocumentOperator {
  key = 'documents';

  async getAll(query: IDocumentQuery, config?: AxiosRequestConfig): Promise<AxiosResponse<IDocumentListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      ...config,
      params: query
    });
  }

  async get(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<IDocumentDetailResponse>> {
    console.log('sss', config);
    return await httpClient.get(`/${this.key}/${id}`, config);
  }

  async create(data: IDocument, config?: AxiosRequestConfig): Promise<AxiosResponse<IDocumentDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data, config);
  }

  async update(
    id: string,
    data: IDocument,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<IDocumentDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data, config);
  }

  async delete(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`, config);
  }
}

export const documentOperator = new DocumentOperator();
