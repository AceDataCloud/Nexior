import { IApi, IPackage } from './api';

export interface IService {
  id: string;
  title: string;
  unit?: string;
  price?: number;
  description?: string;
  free_amount?: number;
  applied_count?: number;
  applied?: boolean;
  tags?: string[];
  thumbnail?: string;
  introduction?: string;
  apis?: IApi[];
  api_ids?: string[];
  packages?: IPackage[];
  package_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface IServiceListResponse {
  count: number;
  items: IService[];
}

export type IServiceDetailResponse = IService;
