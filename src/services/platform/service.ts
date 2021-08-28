import httpClient from '../instance';
import { IPlatform } from './types';

class PlatformService {
  key = 'articles';

  getAll(): Promise<IPlatform> {
    return httpClient.get(`/${this.key}`);
  }

  get(id: number): Promise<IPlatform> {
    return httpClient.get(`/${this.key}/${id}`);
  }

  create(data: IPlatform): Promise<IPlatform> {
    return httpClient.post(`/${this.key}`, data);
  }

  update(id: number, data: IPlatform): Promise<IPlatform> {
    return httpClient.put(`/${this.key}/${id}`, data);
  }

  delete(id: number): Promise<IPlatform> {
    return httpClient.delete(`/${this.key}/${id}`);
  }

  deleteAll(): Promise<IPlatform> {
    return httpClient.delete(`/${this.key}`);
  }
}

export default new PlatformService();
