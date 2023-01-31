import { IApi } from '../api';

export enum IApplicationType {
  API = 'Api',
  PROXY = 'Proxy'
}

export interface IApplication {
  id?: string;
  api?: IApi;
  type?: IApplicationType;
  api_id?: string;
  proxy_id?: string;
  api_key?: string;
  user_id?: string;
  remaining_count?: number;
  used_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface IApplicationListResponse {
  count: number;
  items: IApplication[];
}

export type IApplicationDetailResponse = IApplication;
