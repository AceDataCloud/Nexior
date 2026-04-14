import axios, { AxiosResponse } from 'axios';
import { ISkillListResponse, ISkill } from '@/models';
import { BASE_URL_API } from '@/constants';

class SkillOperator {
  private getHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async list(token: string): Promise<AxiosResponse<ISkillListResponse>> {
    return await axios.post(
      '/aichat2/skills',
      { action: 'list' },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async get(id: string, token: string): Promise<AxiosResponse<ISkill>> {
    return await axios.post(
      '/aichat2/skills',
      { action: 'get', id },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async create(skill: Partial<ISkill>, token: string): Promise<AxiosResponse<ISkill>> {
    return await axios.post(
      '/aichat2/skills',
      { action: 'create', ...skill },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async update(id: string, updates: Partial<ISkill>, token: string): Promise<AxiosResponse<ISkill>> {
    return await axios.post(
      '/aichat2/skills',
      { action: 'update', id, ...updates },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async remove(id: string, token: string): Promise<AxiosResponse<{ success: boolean }>> {
    return await axios.post(
      '/aichat2/skills',
      { action: 'delete', id },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }
}

export const skillOperator = new SkillOperator();
