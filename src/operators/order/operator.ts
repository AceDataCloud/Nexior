import { AxiosResponse } from 'axios';
import { httpClient } from '../instance';
import { IOrder, IOrderDetailResponse, IOrderListResponse } from './models';

class OrderService {
  key = 'orders';

  async getAll(): Promise<AxiosResponse<IOrderListResponse>> {
    return await httpClient.get(`/${this.key}/`);
  }

  async get(id: string): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IOrder): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: IOrder): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const orderOperator = new OrderService();
