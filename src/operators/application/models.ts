export interface IApplication {
  id?: string;
  service: string;
  api_key?: string;
  user_id?: string;
  remaining_count?: number;
  used_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface IApplicationListResponse {
  count: number;
  items: IApplication[];
}

export type IApplicationDetailResponse = IApplication;
