import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { IOrder, IOrderDetailResponse, IOrderListResponse } from '@/models';

export interface IOrderQuery {
  user_id?: string;
  package_id?: string;
  applications_ids?: string[];
  package_ids?: string[];
  offset?: number;
  limit?: number;
  ordering: string;
}

class OrderService {
  key = 'orders';

  async getAll(query: IOrderQuery): Promise<AxiosResponse<IOrderListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
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

  async refresh(id: string): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/refresh/`);
  }

  async pay(id: string, data: IOrder): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/pay/`, data);
  }

  async updatePrice(id: string, data: IOrder): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/update-price/`, data);
  }

  async finish(id: string): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/finish/`);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const orderOperator = new OrderService();
