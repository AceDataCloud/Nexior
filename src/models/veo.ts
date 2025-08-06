export interface IVeoConfig {
  action?: string;
  model?: string;
  video_id?: string;
  video_url?: string;
  image_urls?: string[];
  prompt?: string;
  callback_url?: string;
}

export interface IVeoGenerateRequest {
  action?: string;
  model?: string;
  video_id?: string;
  video_url?: string;
  image_urls?: string[];
  prompt?: string;
  callback_url?: string;
  mirror?: boolean;
}
export interface IVeoVideo {
  id?: string;
  video_url?: string;
  state?: string;
  created_at?: string;
  complete_at?: string;
}
export interface IVeoGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IVeoVideo[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IVeoTask {
  id: string;
  created_at?: number;
  request?: IVeoGenerateRequest;
  response?: IVeoGenerateResponse;
}

export type IVeoTaskResponse = IVeoTask;

export interface IVeoTasksResponse {
  count: number;
  items: IVeoTask[];
}
