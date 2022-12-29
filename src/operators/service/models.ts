export interface IService {
  id: number;
  title: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  icon?: string;
  price?: number;
  appliedCount: number;
  introduction: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IServiceListResponse {
  count: number;
  items: IService[];
}

export type IServiceDetailResponse = IService;
