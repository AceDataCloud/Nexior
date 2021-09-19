import { AxiosResponse } from 'axios';
import httpClient from '../../instance';
import { IArticle, IArticleDetailResponse, IArticleListResponse } from './types';

class ArticleService {
  key = 'articles';

  async getAll(offset: number = 0, limit: number = 10): Promise<AxiosResponse<IArticleListResponse>> {
    return await httpClient.get(`/${this.key}/?limit=${limit}&offset=${offset}`);
  }

  async get(id: string | string[]): Promise<AxiosResponse<IArticleDetailResponse>> {
    return httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IArticle): Promise<AxiosResponse<IArticleDetailResponse>> {
    return httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string | string[], data: IArticle): Promise<AxiosResponse<IArticleDetailResponse>> {
    return httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: string | string[]): Promise<AxiosResponse<null>> {
    return httpClient.delete(`/${this.key}/${id}`);
  }
}

export default new ArticleService();
