import { IApi } from '../api/models';

export enum IDocumentType {
  API = 'Api',
  TEXT = 'Text'
}

export interface IDocument {
  id?: string;
  name?: string;
  type: IDocumentType;
  title?: string;
  content?: string;
  rank?: number;
  api?: IApi;
  api_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IDocumentListResponse {
  count: number;
  items: IDocument[];
}

export type IDocumentDetailResponse = IDocument;
