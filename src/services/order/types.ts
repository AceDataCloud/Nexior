export const ORDER_STATE_PENDING = 'Pending';
export const ORDER_STATE_PAID = 'Paid';
export const ORDER_STATE_EXPIRED = 'Expired';
export const ORDER_STATE_FAILED = 'Failed';

export interface IOrder {
  id?: string;
  description?: string;
  state?: typeof ORDER_STATE_PENDING | typeof ORDER_STATE_PAID | typeof ORDER_STATE_EXPIRED | typeof ORDER_STATE_FAILED;
  price?: number;
  creatorId?: number;
  createdAt?: string;
  updatedAt?: string;
  courses?: number[];
  wechatpayUrl?: string;
}

export interface IOrderListResponse {
  count: number;
  items: IOrder[];
}

export type IOrderDetailResponse = IOrder;
