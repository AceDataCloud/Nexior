export interface IOpenAIImageConfig {
  prompt?: string;
  image_urls?: string[];
  size?: string;
  callback_url?: string;
  model?: string;
}

export interface IOpenAIImageGenerateRequest {
  action?: 'generate' | 'edit';
  model?: string;
  prompt?: string;
  size?: string;
  callback_url?: string;
  background?: 'transparent' | 'opaque' | 'auto';
  quality?: 'auto' | 'high' | 'medium' | 'low' | 'standard';
}

export interface IOpenAIImageEditRequest {
  action?: 'generate' | 'edit';
  model?: string;
  prompt?: string;
  image_urls?: string[];
  callback_url?: string;
}

export interface IOpenAIImageImage {
  url?: string;
  b64_json?: string;
  image_url?: string;
}

export interface IOpenAIImageGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IOpenAIImageImage[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IOpenAIImageTask {
  id: string;
  type?: string;
  created_at?: number;
  request?: IOpenAIImageGenerateRequest | IOpenAIImageEditRequest;
  response?: IOpenAIImageGenerateResponse;
}

export type IOpenAIImageTaskResponse = IOpenAIImageTask;

export interface IOpenAIImageTasksResponse {
  count: number;
  items: IOpenAIImageTask[];
}
