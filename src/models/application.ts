import { IPackage } from './api';
import { ICredential } from './credential';
import { IService } from './service';

export enum IApplicationType {
  USAGE = 'Usage',
  PERIOD = 'Period'
}

export enum IApplicationScope {
  INDIVIDUAL = 'Individual',
  GLOBAL = 'Global'
}

export interface IApplication {
  id?: string;
  packages?: IPackage[];
  type?: IApplicationType;
  scope?: IApplicationScope;
  service_id?: string;
  service?: IService;
  user_id?: string;
  remaining_amount?: number;
  used_amount?: number;
  allow_consume_global?: boolean;
  credentials?: ICredential[];
  created_at?: string;
  updated_at?: string;
  expired_at?: string;
  // Set by the backend (PR #540) when the current user is a grantee on this
  // application rather than its owner. Used to skip auto-createCredential and
  // to surface a "Shared" badge in the UI.
  role?: 'owner' | 'grantee';
}

export interface IApplicationListResponse {
  count: number;
  items: IApplication[];
}

export type IApplicationDetailResponse = IApplication;
