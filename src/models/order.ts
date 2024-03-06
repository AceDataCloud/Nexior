import { IApplication } from './application';

export enum OrderState {
  PENDING = 'Pending',
  PAID = 'Paid',
  EXPIRED = 'Expired',
  FAILED = 'Failed'
}

export interface IOrder {
  id?: string;
  description?: string;
  state?: OrderState;
  price?: number;
  amount?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  application?: IApplication;
  application_id?: string;
  wechatpay_url?: string;
  pay_id?: string;
  pay_url?: string;
  alipay_url?: string;
  pay_way?: string;
}

export interface IOrderListResponse {
  count: number;
  items: IOrder[];
}

export type IOrderDetailResponse = IOrder;
