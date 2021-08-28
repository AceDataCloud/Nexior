import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { IArticle, IArticleDetailResponse, IArticleListResponse } from './types';

class ArticleService {
  key = 'articles';

  async getAll(): Promise<AxiosResponse<IArticleListResponse>> {
    return await httpClient.get(`/${this.key}`);
  }

  async get(id: number): Promise<AxiosResponse<IArticleDetailResponse>> {
    return httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IArticle): Promise<AxiosResponse<IArticleDetailResponse>> {
    return httpClient.post(`/${this.key}`, data);
  }

  async update(id: number, data: IArticle): Promise<AxiosResponse<IArticleDetailResponse>> {
    return httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return httpClient.delete(`/${this.key}/${id}`);
  }
}

export default new ArticleService();
