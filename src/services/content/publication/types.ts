import { IArticle } from '../article/types';
import { IPlatform } from '../platform/types';

export interface IPublication {
  id: number;
  name: string;
  state: string;
  platform: IPlatform;
  article: IArticle;
}

export const CREDENTIAL_TYPE_COOKIES = 'Cookies';
export const CREDENTIAL_TYPE_TOKEN = 'Token';

export interface IPublicationCreateRequest {
  article: string;
  platform: number;
  credential: string;
  state?: string;
  credentialType?: typeof CREDENTIAL_TYPE_COOKIES | typeof CREDENTIAL_TYPE_TOKEN;
}

export interface IPublicationListResponse {
  count: number;
  results: IPublication[];
}

export type IPublicationDetailResponse = IPublication;
