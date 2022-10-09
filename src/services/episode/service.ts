import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { IResourceDetailResponse } from '../resource/types';
import { IEpisode, IEpisodeDetailResponse, IEpisodeListResponse } from './types';

class EpisodeService {
  key = 'episodes';

  async getAll(): Promise<AxiosResponse<IEpisodeListResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }

  async get(id: number): Promise<AxiosResponse<IEpisodeDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async resource(id: number): Promise<AxiosResponse<IResourceDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}/resource/`);
  }

  async create(data: IEpisode): Promise<AxiosResponse<IEpisodeDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: number, data: IEpisode): Promise<AxiosResponse<IEpisodeDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }

  async createForCourse(courseId: number, data: IEpisode): Promise<AxiosResponse<IEpisodeDetailResponse>> {
    return await httpClient.post(`/courses/${courseId}/${this.key}/`, data);
  }

  async getAllForCourse(courseId: number): Promise<AxiosResponse<IEpisodeListResponse>> {
    return await httpClient.get(`/courses/${courseId}/${this.key}/`);
  }
}

export const episodeService = new EpisodeService();
