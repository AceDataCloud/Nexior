import { IApi } from '../api';
import { IProxy } from '../proxy';

export enum IApplicationType {
  API = 'Api',
  PROXY = 'Proxy'
}

export enum ICredentialType {
  TOKEN = 'Token',
  IDENTITY = 'Identity'
}

export interface ICredential {
  type: ICredentialType;
  name?: string;
  token?: string;
  username?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IApplication {
  id?: string;
  api?: IApi;
  proxy?: IProxy;
  type?: IApplicationType;
  api_id?: string;
  proxy_id?: string;
  api_key?: string;
  user_id?: string;
  remaining_amount?: number;
  used_amount?: number;
  credential?: ICredential;
  created_at?: string;
  updated_at?: string;
}

export interface IApplicationListResponse {
  count: number;
  items: IApplication[];
}

export type IApplicationDetailResponse = IApplication;
