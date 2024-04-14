import { IApplication } from './application';

export enum ICredentialType {
  TOKEN = 'Token',
  IDENTITY = 'Identity'
}

export interface ICredential {
  id?: string;
  name?: string;
  type?: ICredentialType;
  limited_amount?: number;
  host?: string;
  used_amount?: number;
  expired_at?: string;
  token?: string;
  username?: string;
  password?: string;
  application?: IApplication;
  application_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface ICredentialListResponse {
  count: number;
  items: ICredential[];
}

export type ICredentialDetailResponse = ICredential;
