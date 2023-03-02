import { IApi } from '../api/models';

export interface IService {
  id: string;
  title: string;
  unit?: string;
  price?: number;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  introduction?: string;
  api_ids?: string[];
  apis?: IApi[];
  created_at?: string;
  updated_at?: string;
}

export interface IServiceListResponse {
  count: number;
  items: IService[];
}

export type IServiceDetailResponse = IService;
