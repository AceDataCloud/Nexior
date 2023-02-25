import { IPackage } from '../api';
import { IDocument } from '../document';
import { IService } from '../service';

export interface IProxy {
  id: string;
  path: string;
  endpoint: string;
  price?: number;
  title?: string;
  introduction?: string;
  apply_count?: number;
  free_count?: number;
  applied?: boolean;
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
