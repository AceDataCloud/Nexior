export interface IApi {
  id: number;
  name: string;
  endpoint: string;
  requestMethod: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IApiListResponse {
  count: number;
  items: IApi[];
}

export type IApiDetailResponse = IApi;
