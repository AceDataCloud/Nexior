import { IService } from './service';

export enum IApplicationType {
  API = 'Api'
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
  type?: IApplicationType;
  service_id?: string;
  service?: IService;
  user_id?: string;
  remaining_amount?: number;
  used_amount?: number;
  credentials?: ICredential[];
  created_at?: string;
  updated_at?: string;
}

export interface IApplicationListResponse {
  count: number;
  items: IApplication[];
}

export type IApplicationDetailResponse = IApplication;
