export interface IOrder {
  id?: string;
  description?: string;
  state?: 'Pending' | 'Expired' | 'Paied' | 'Failed';
  price?: number;
  creatorId?: number;
  createdAt?: string;
  updatedAt?: string;
  courses?: number[];
}

export interface IOrderListResponse {
  count: number;
  items: IOrder[];
}

export type IOrderDetailResponse = IOrder;
