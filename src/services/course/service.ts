import { AxiosResponse } from 'axios';
import httpClient from '../instance';
import { ICourse, ICourseDetailResponse, ICourseListResponse } from './types';

class CourseService {
  key = 'courses';

  async getAll(): Promise<AxiosResponse<ICourseListResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }

  async get(id: number): Promise<AxiosResponse<ICourseDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: ICourse): Promise<AxiosResponse<ICourseDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: number, data: ICourse): Promise<AxiosResponse<ICourseDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: number): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }

  async createForTeacher(teacherId: number, data: ICourse): Promise<AxiosResponse<ICourseDetailResponse>> {
    return await httpClient.post(`/teachers/${teacherId}/${this.key}/`, data);
  }

  async getAllForTeacher(teacherId: number): Promise<AxiosResponse<ICourseListResponse>> {
    return await httpClient.get(`/teachers/${teacherId}/${this.key}/`);
  }
}

export const courseService = new CourseService();
