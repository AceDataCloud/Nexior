import { IPackage } from '../api';
import { IDocument } from '../document';
import { IService } from '../service';

export enum IProxyUnit {
  MB = 'MB'
}

export interface IProxy {
  id: string;
  path: string;
  endpoint: string;
  unit?: IProxyUnit;
  price?: number;
  title?: string;
  introduction?: string;
  applied_count?: number;
  free_amount?: number;
  applied?: boolean;
  application_id?: string;
  tags?: string[];
  document?: IDocument;
  document_id?: string;
  service?: IService;
  packages?: IPackage[];
  service_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IProxyListResponse {
  count: number;
  items: IProxy[];
}

export type IProxyDetailResponse = IProxy;
