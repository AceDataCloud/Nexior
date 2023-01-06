export interface IApi {
  id: string;
  alias: string;
  title?: string;
  description?: string;
  tags?: string[];
  endpoint?: string;
  isFree?: boolean;
  swaggerConfiguration?: string;
  service?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IApiListResponse {
  count: number;
  items: IApi[];
}

export type IApiDetailResponse = IApi;
