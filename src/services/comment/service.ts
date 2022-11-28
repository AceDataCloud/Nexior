import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { IComment, ICommentDetailResponse, ICommentListResponse } from './types';

class CommentService {
  key = 'comments';

  async getAll(): Promise<AxiosResponse<ICommentListResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }

  async get(id: number): Promise<AxiosResponse<ICommentDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IComment): Promise<AxiosResponse<ICommentDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: number, data: IComment): Promise<AxiosResponse<ICommentDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }

  async createForEpisode(episodeId: number, data: IComment): Promise<AxiosResponse<ICommentDetailResponse>> {
    return await httpClient.post(`/episodes/${episodeId}/${this.key}/`, data);
  }

  async getAllForEpisode(episodeId: number): Promise<AxiosResponse<ICommentListResponse>> {
    return await httpClient.get(`/episodes/${episodeId}/${this.key}/`);
  }
}

export const commentService = new CommentService();
