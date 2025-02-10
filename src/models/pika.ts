export interface IPikaConfig {
  action?: string;
  effect?: string;
  prompt?: string;
  negative_prompt?: string;
  model?: string;
  image_url?: string[];
  ingredients?: boolean;
  ingredients_mode?: string;
  callback_url?: string;
}

export interface IPikaGenerateRequest {
  action?: string;
  effect?: string;
  prompt?: string;
  negative_prompt?: string;
  model?: string;
  image_url?: string[];
  ingredients?: boolean;
  ingredients_mode?: string;
  callback_url?: string;
  mirror?: boolean;
}
export interface IPikaVideo {
  id?: string;
  video_url?: string;
  image_url?: string;
  duration?: number;
  state?: string;
  action?: string;
}
export interface IPikaGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id: string;
  data?: IPikaVideo[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IPikaTask {
  id: string;
  created_at?: number;
  request?: IPikaGenerateRequest;
  response?: IPikaGenerateResponse;
}

export type IPikaTaskResponse = IPikaTask;

export interface IPikaTasksResponse {
  count: number;
  items: IPikaTask[];
}
