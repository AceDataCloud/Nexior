import httpClient from '../instance';
import { IArticle } from './types';

class ArticleService {
  name = 'articles';

  getAll(): Promise<IArticle> {
    return httpClient.get(`/${this.name}`);
  }

  get(id: number): Promise<IArticle> {
    return httpClient.get(`/${this.name}/${id}`);
  }

  create(data: IArticle): Promise<IArticle> {
    return httpClient.post(`/${this.name}`, data);
  }

  update(id: number, data: IArticle): Promise<IArticle> {
    return httpClient.put(`/${this.name}/${id}`, data);
  }

  delete(id: number): Promise<IArticle> {
    return httpClient.delete(`/${this.name}/${id}`);
  }

  deleteAll(): Promise<IArticle> {
    return httpClient.delete(`/${this.name}`);
  }
}

export default new ArticleService();
