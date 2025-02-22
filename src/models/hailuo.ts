export interface IHailuoConfig {
  action?: string;
  prompt?: string;
  model?: string;
  first_image_url?: string;
  callback_url?: string;
}

export interface IHailuoGenerateRequest {
  action?: string;
  prompt?: string;
  model?: string;
  first_image_url?: string;
  callback_url?: string;
  mirror?: boolean;
}
export interface IHailuoVideo {
  id?: string;
  video_url?: string;
  model?: string;
  prompt?: string;
  state?: string;
  action?: string;
}
export interface IHailuoGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id: string;
  data?: IHailuoVideo[];
  video_id?: string;
  prompt?: string;
  thumbnail_url?: string;
  video_url?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IHailuoTask {
  id: string;
  created_at?: number;
  request?: IHailuoGenerateRequest;
  response?: IHailuoGenerateResponse;
}

export type IHailuoTaskResponse = IHailuoTask;

export interface IHailuoTasksResponse {
  count: number;
  items: IHailuoTask[];
}
