import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import {
  IDistributionHistoryListResponse,
  IDistributionLevelListResponse,
  IDistributionStatusDetailResponse,
  IDistributionStatusListResponse
} from '@/models';

export interface IDistributionHistoryQuery {
  user_id?: string;
  offset?: number;
  limit?: number;
  ordering: string;
}

class DistributionHistoryService {
  key = 'distribution-histories';

  async getAll(query: IDistributionHistoryQuery): Promise<AxiosResponse<IDistributionHistoryListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }
}

export const distributionHistoryOperator = new DistributionHistoryService();

export interface IDistributionStatusQuery {
  user_id?: string;
}

class DistributionStatusService {
  key = 'distribution-statuses';

  async getAll(query: IDistributionStatusQuery): Promise<AxiosResponse<IDistributionStatusListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async initialize(): Promise<AxiosResponse<IDistributionStatusDetailResponse>> {
    return await httpClient.post(`/${this.key}/initialize/`);
  }
}

export const distributionStatusOperator = new DistributionStatusService();

export interface IDistributionLevelQuery {
  user_id?: string;
  limit?: number;
}

class DistributionLevelService {
  key = 'distribution-levels';

  async getAll(query: IDistributionLevelQuery): Promise<AxiosResponse<IDistributionLevelListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }
}

export const distributionLevelOperator = new DistributionLevelService();

interface IShortUrlCreateResponse {
  data: {
    url: string;
  };
}

class ShortUrlService {
  key = 'shorturl';

  async create(url: string): Promise<AxiosResponse<IShortUrlCreateResponse>> {
    return await httpClient.post(`/${this.key}`, {
      content: url
    });
  }
}

export const shortUrlOperator = new ShortUrlService();
