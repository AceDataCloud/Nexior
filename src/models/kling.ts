export interface IKlingConfig {
  action?: string;
  mode?: string;
  model?: string;
  video_id?: string;
  prompt?: string;
  start_image_url?: string;
  end_image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: number;
  camera_control?: string;
  cfg_scale?: number;
  callback_url?: string;
}

export interface IKlingGenerateRequest {
  action?: string;
  mode?: string;
  model?: string;
  video_id?: string;
  prompt?: string;
  start_image_url?: string;
  end_image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: number;
  camera_control?: string;
  cfg_scale?: number;
  callback_url?: string;
  mirror?: boolean;
}
export interface IKlingVideo {
  id?: string;
  video_url?: string;
  video_id?: string;
  duration?: number;
  state?: string;
  action?: string;
}
export interface IKlingGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  video_url?: string;
  video_id?: string;
  duration?: number;
  state?: string;
  action?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IKlingTask {
  id: string;
  created_at?: number;
  request?: IKlingGenerateRequest;
  response?: IKlingGenerateResponse;
}

export type IKlingTaskResponse = IKlingTask;

export interface IKlingTasksResponse {
  count: number;
  items: IKlingTask[];
}
