import { IApi } from '../api/models';
import { IProxy } from '../proxy';

export enum IDocumentType {
  API = 'Api',
  TEXT = 'Text',
  PROXY = 'Proxy'
}

export interface IDocument {
  id?: string;
  name?: string;
  type: IDocumentType;
  title?: string;
  content?: string;
  rank?: number;
  api?: IApi;
  proxy?: IProxy;
  api_id?: string;
  proxy_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IDocumentListResponse {
  count: number;
  items: IDocument[];
}

export type IDocumentDetailResponse = IDocument;
