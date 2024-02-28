import { IOrder } from './order';

export interface IDistributionHistory {
  id: string;
  user_id: string;
  invitee_id: string;
  order?: IOrder;
  order_id?: string;
  price: number;
  reward: number;
  percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface IDistributionLevel {
  id: string;
  level: number;
  threshold: number;
  percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface IDistributionStatus {
  id: string;
  user_id: string;
  price: number;
  reward: number;
  level_id?: string;
  level?: IDistributionLevel;
  percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface IDistributionStatusListResponse {
  count: number;
  items: IDistributionStatus[];
}

export type IDistributionStatusDetailResponse = IDistributionStatus;

export interface IDistributionHistoryListResponse {
  count: number;
  items: IDistributionHistory[];
}

export type IDistributionHistoryDetailResponse = IDistributionHistory;

export interface IDistributionLevelListResponse {
  count: number;
  items: IDistributionLevel[];
}
