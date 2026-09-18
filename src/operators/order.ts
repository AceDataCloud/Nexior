import { AxiosResponse } from 'axios';
import { anonymousHttpClient, httpClient } from './common';
import { IOrder, IOrderDetailResponse, IOrderListResponse, IOrderPayRequest, IOrderPayResponse } from '@/models';
import { getStickyFeatureOverrides, isFeatureEnabled } from '@/utils/featureFlag';

export interface IOrderQuery {
  user_id?: string;
  package_id?: string;
  applications_ids?: string[];
  package_ids?: string[];
  offset?: number;
  limit?: number;
  ordering?: string;
  pay_way?: string | string[];
  created_at_from?: string | Date;
  created_at_to?: string | Date;
  state?: string | string[];
}

export interface IOrderSummary {
  total_count: number;
  total_spent: number;
  state_counts: Record<string, number>;
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

  async getPublic(id: string): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await anonymousHttpClient.get(`/${this.key}/${id}`);
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

  private paymentConfig() {
    const tokens = getStickyFeatureOverrides()
      .split(',')
      .filter(Boolean)
      .filter((token) => token !== 'all');
    if (isFeatureEnabled('airwallex') && !tokens.includes('-airwallex') && !tokens.includes('airwallex')) {
      tokens.push('airwallex');
    }
    const overrides = tokens.join(',');
    return { headers: overrides ? { 'x-feature-overrides': overrides } : undefined };
  }

  async pay(id: string, data: IOrderPayRequest): Promise<AxiosResponse<IOrderPayResponse>> {
    return await httpClient.post(`/${this.key}/${id}/pay/`, data, this.paymentConfig());
  }

  // Backend AllowAny endpoint: the unguessable order UUID is the capability,
  // and the server restricts anonymous callers to hosted payment methods.
  async payPublic(id: string, data: IOrderPayRequest): Promise<AxiosResponse<IOrderPayResponse>> {
    return await anonymousHttpClient.post(`/${this.key}/${id}/pay/`, data, this.paymentConfig());
  }

  async payX402WithHeader(
    id: string,
    data: IOrder,
    xPaymentHeader: string
  ): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/pay/`, data, {
      headers: {
        'PAYMENT-SIGNATURE': xPaymentHeader
      }
    });
  }

  async appleVerify(id: string, transactionId: string): Promise<AxiosResponse<IOrderDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/apple-verify/`, { transaction_id: transactionId });
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

  async getSummary(query: IOrderQuery): Promise<AxiosResponse<IOrderSummary>> {
    return await httpClient.get(`/${this.key}/summary/`, { params: query });
  }

  async exportCsv(query: IOrderQuery): Promise<AxiosResponse<Blob>> {
    return await httpClient.get(`/${this.key}/export/`, {
      params: query,
      responseType: 'blob'
    });
  }
}

export const orderOperator = new OrderService();
