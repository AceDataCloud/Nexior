import { AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { IDocument, IDocumentDetailResponse, IDocumentListResponse } from './models';

export interface IDocumentQuery {
  limit: number;
  offset: number;
}

class DocumentOperator {
  key = 'documents';

  async getAll(query: IDocumentQuery): Promise<AxiosResponse<IDocumentListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async get(id: string): Promise<AxiosResponse<IDocumentDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IDocument): Promise<AxiosResponse<IDocumentDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: IDocument): Promise<AxiosResponse<IDocumentDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const documentOperator = new DocumentOperator();
