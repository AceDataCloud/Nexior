import { IApplication } from './application';
import { IPackage } from './api';

export enum OrderState {
  PENDING = 'Pending',
  PAID = 'Paid',
  EXPIRED = 'Expired',
  FAILED = 'Failed',
  FINISHED = 'Finished',
  REFUNDED = 'Refunded'
}

export enum OrderScope {
  APPLICATION = 'Application',
  GLOBAL = 'Global'
}

export interface IOrder {
  id?: string;
  description?: string;
  scope?: OrderScope;
  state?: OrderState;
  price?: number;
  discount?: number;
  amount?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  application?: IApplication;
  application_id?: string;
  application_ids?: string[];
  package_id?: string;
  package_ids?: string[];
  package?: IPackage;
  packages?: IPackage[];
  wechatpay_url?: string;
  pay_id?: string;
  pay_url?: string;
  alipay_url?: string;
  pay_way?: string;
  metadata?: Record<string, any>;
}

export interface IOrderPayRequest {
  pay_way: string;
  surface?: string;
  payment_contract?: 'airwallex_payment_intent';
}

export interface IAirwallexBillingCheckoutPayment {
  provider: 'airwallex';
  flow: 'billing_checkout';
  checkout_id: string;
  url: string;
}

export interface IAirwallexPaymentIntentPayment {
  provider: 'airwallex';
  flow: 'payment_intent_hpp';
  intent_id: string;
  client_secret: string;
  currency: 'USD';
  environment: 'demo' | 'prod';
  success_url: string;
}

export type IAirwallexPayment = IAirwallexBillingCheckoutPayment | IAirwallexPaymentIntentPayment;

export interface IOrderPayResponse extends IOrder {
  payment?: IAirwallexPayment;
}

export interface IOrderListResponse {
  count: number;
  items: IOrder[];
}

export type IOrderDetailResponse = IOrder;
