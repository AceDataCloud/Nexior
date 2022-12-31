export interface IApplication {
  id?: string;
  service: string;
  apiKey?: string;
  userId?: string;
  remainingCount?: number;
  usedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IApplicationListResponse {
  count: number;
  items: IApplication[];
}

export type IApplicationDetailResponse = IApplication;
