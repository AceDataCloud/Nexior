import { IApi, IPackage } from './api';

export enum IServiceType {
  API = 'Api',
  Proxy = 'Proxy',
  Dataset = 'Dataset'
}

export interface IProxy {
  id: string;
  title?: string;
  service?: IService;
  service_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IDataset {
  id: string;
  title?: string;
  service?: IService;
  service_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IService {
  id: string;
  alias?: string;
  title: string;
  unit?: string;
  price?: number;
  description?: string;
  free_amount?: number;
  applied_count?: number;
  applied?: boolean;
  type?: IServiceType;
  cost?: any;
  tags?: string[];
  metadata?: any;
  thumbnail?: string;
  introduction?: string;
  proxies?: IProxy[];
  proxy_ids?: string[];
  apis?: IApi[];
  api_ids?: string[];
  datasets?: IDataset[];
  dataset_ids?: string[];
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
