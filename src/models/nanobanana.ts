export interface INanobananaConfig {
  action?: 'generate' | 'edit';
  prompt?: string;
  image_urls?: string[];
  aspect_ratio?: string;
  callback_url?: string;
}

export interface INanobananaGenerateRequest {
  action?: 'generate' | 'edit';
  prompt?: string;
  image_urls?: string[];
  aspect_ratio?: string;
  callback_url?: string;
  mirror?: boolean;
}

export interface INanobananaImage {
  prompt?: string;
  image_url?: string;
}

export interface INanobananaGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: INanobananaImage[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface INanobananaTask {
  id: string;
  created_at?: number;
  request?: INanobananaGenerateRequest;
  response?: INanobananaGenerateResponse;
}

export type INanobananaTaskResponse = INanobananaTask;

export interface INanobananaTasksResponse {
  count: number;
  items: INanobananaTask[];
}
