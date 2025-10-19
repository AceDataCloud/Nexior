export interface ISoraConfig {
  action?: string;
  model?: string;
  orientation?: string;
  size?: string;
  duration?: number;
  image_urls?: string[];
  prompt?: string;
  callback_url?: string;
}

export interface ISoraGenerateRequest {
  action?: string;
  model?: string;
  duration?: number;
  size?: string;
  orientation?: string;
  video_id?: string;
  video_url?: string;
  image_urls?: string[];
  prompt?: string;
  translation?: boolean;
  aspect_ratio?: string;
  callback_url?: string;
  mirror?: boolean;
}
export interface ISoraVideo {
  id?: string;
  video_url?: string;
  state?: string;
  created_at?: string;
  complete_at?: string;
}
export interface ISoraGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: ISoraVideo[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ISoraTask {
  id: string;
  created_at?: number;
  request?: ISoraGenerateRequest;
  response?: ISoraGenerateResponse;
}

export type ISoraTaskResponse = ISoraTask;

export interface ISoraTasksResponse {
  count: number;
  items: ISoraTask[];
}
