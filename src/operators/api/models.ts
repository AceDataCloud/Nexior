export interface ISchema {
  properties: {
    [key: string]: ISchema;
  };
  type: 'object' | 'array' | 'string' | 'number';
  title: string;
  optional: boolean;
}

export interface IRequest {
  id: string;
  body: ISchema;
  headers: ISchema;
  queries: ISchema;
  params: ISchema;
  method: 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
}

export interface IResponse {
  id: string;
  title: string;
  description?: string;
  example?: string;
  isSuccess: boolean;
  errorCode?: string;
  statusCode: number;
  body: ISchema;
  headers: ISchema;
}

export interface IApi {
  id: string;
  path: string;
  endpoint: string;
  alias: string;
  title?: string;
  introduction?: string;
  tags?: string[];
  request: IRequest;
  responses: IResponse[];
  isFree?: boolean;
  service?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IApiListResponse {
  count: number;
  items: IApi[];
}

export type IApiDetailResponse = IApi;
