export interface ILumaConfig {
  action?: string;
  video_id?: string;
  prompt?: string;
  video_url?: string;
  start_image_url?: string;
  end_image_url?: string;
  enhancement?: boolean;
  loop?: boolean;
  thumbnail_url?: string;
  custom?: boolean;
}

export interface ILumaGenerateRequest {
  action?: string;
  video_id?: string;
  prompt?: string;
  video_url?: string;
  start_image_url?: string;
  end_image_url?: string;
  enhancement?: boolean;
  loop?: boolean;
  callback_url?: string;
}

export interface ILumaGenerateResponse {
  success: boolean;
  task_id: string;
  video_id: string;
  prompt: string;
  video_url: string;
  video_height: number;
  video_width: number;
  state: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  trace_id: string;
  data?: {
    video_id?: string;
    state?: string;
  };
  error: {
    code?: string;
    message?: string;
  };
}

export interface ILumaTask {
  id: string;
  created_at?: string;
  request?: ILumaGenerateRequest;
  response?: ILumaGenerateResponse;
}

export type ILumaTaskResponse = ILumaTask;

export interface ILumaTasksResponse {
  count: number;
  items: ILumaTask[];
}
