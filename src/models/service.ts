import type { ICostRule } from '@acedatacloud/core/pricing';
import { IApi, IPackage } from './api';

export enum IServiceType {
  API = 'Api',
  Agent = 'Agent',
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

export interface IServiceCostRule extends ICostRule {
  unit?: string;
  remark?: string | Record<string, string>;
  official_price?: number | Record<string, unknown>;
  [key: string]: unknown;
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
  cost?: IServiceCostRule[];
  tags?: string[];
  metadata?: any;
  thumbnail?: string;
  // Square brand logo / favicon on cdn.acedata.cloud.
  icon_url?: string;
  // Catalog-private services are hidden from the public site picker.
  private?: boolean;
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
