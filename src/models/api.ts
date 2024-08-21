import { IService } from './service';

export interface IForm {
  queries?: {
    [key: string]: string;
  };
  headers?: {
    [key: string]: string;
  };
  body?: {
    [key: string]: string | object | boolean | number | object[];
  };
}

export interface ISchema {
  properties?: {
    [key: string]: ISchema;
  };
  items?: ISchema[];
  enum?: (string | number)[];
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  title: string;
  optional?: boolean;
  example?: string | number;
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
  is_success: boolean;
  error_code?: string;
  status_code: number;
  body: ISchema;
  headers: ISchema;
}

export enum IPackageType {
  PERIOD = 'Period',
  USAGE = 'Usage'
}

export interface IPackage {
  id: string;
  amount: number;
  price: number;
  duration?: number;
  type?: IPackageType;
  service?: IService;
}

export enum IApiUnit {
  COUNT = 'Count'
}

export interface IApiPrice {
  data: any[];
  spans: [number, number, number, number][];
  columns: {
    key: string;
    label: string;
  }[];
}

export interface IApiEstimationItem {
  name: string;
  cost: number;
  remark: string;
  comparisons: {
    target: string;
    value: number;
  }[];
}

export type IApiEstimation = IApiEstimationItem[];

export interface IApi {
  id: string;
  name?: string;
  title?: string;
  definition?: any;
  estimation?: IApiEstimation;
  introduction?: string;
  price?: IApiPrice;
  tags?: string[];
  service?: IService;
  service_id?: string;
  created_at?: string;
  updated_at?: string;
  stage?: string;
}

export interface IApiListResponse {
  count: number;
  items: IApi[];
}

export type IApiDetailResponse = IApi;
