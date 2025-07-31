export interface IPixverseConfig {
  action?: string;
  mode?: string;
  model?: string;
  style?: string;
  motion?: string;
  quality?: string;
  prompt?: string;
  image_url?: string;
  duration?: number;
  seed?: number;
  callback_url?: string;
}

export interface IPixverseGenerateRequest {
  action?: string;
  mode?: string;
  model?: string;
  style?: string;
  motion?: string;
  quality?: string;
  prompt?: string;
  image_url?: string;
  duration?: number;
  seed?: number;
  callback_url?: string;
}
export interface IPixverseVideo {
  id?: string;
  first_frame?: string;
  last_frame?: string;
  video_width?: number;
  video_height?: number;
  prompt?: string;
  model?: string;
  quality?: string;
  motion?: string;
  template_id?: number;
  template_name?: string;
  style?: string;
  aspect_ratio?: string;
  video_url?: string;
  duration?: number;
  seed?: number;
  state?: string;
  action?: string;
}
export interface IPixverseGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IPixverseVideo[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IPixverseTask {
  id: string;
  created_at?: number;
  request?: IPixverseGenerateRequest;
  response?: IPixverseGenerateResponse;
}

export type IPixverseTaskResponse = IPixverseTask;

export interface IPixverseTasksResponse {
  count: number;
  items: IPixverseTask[];
}
