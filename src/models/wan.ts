export interface IWanConfig {
  action?: string;
  prompt?: string;
  model?: string;
  resolution?: string;
  duration?: number;
  image_url?: string;
  audio?: boolean;
  prompt_extend?: boolean;
  callback_url?: string;
}

export interface IWanGenerateRequest {
  action?: string;
  prompt?: string;
  model?: string;
  resolution?: string;
  duration?: number;
  image_url?: string;
  audio?: boolean;
  prompt_extend?: boolean;
  negative_prompt?: string;
  callback_url?: string;
}

export interface IWanVideo {
  id?: string;
  video_url?: string;
  model?: string;
  prompt?: string;
  state?: string;
  action?: string;
}

export interface IWanGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id: string;
  video_id?: string;
  video_url?: string;
  thumbnail_url?: string;
  state?: string;
  prompt?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IWanTask {
  id: string;
  created_at?: number;
  elapsed?: number;
  request?: IWanGenerateRequest;
  response?: IWanGenerateResponse;
}

export type IWanTaskResponse = IWanTask;

export interface IWanTasksResponse {
  count: number;
  items: IWanTask[];
}
