export type OpenAIImageQuality = 'auto' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
export type OpenAIImageOutputFormat = 'png' | 'jpeg' | 'webp' | 'gif';

export interface IOpenAIImageOutputConfig {
  output_format?: OpenAIImageOutputFormat;
  frame_count?: number;
  frame_duration_ms?: number;
}

export interface IOpenAIImageConfig extends IOpenAIImageOutputConfig {
  prompt?: string;
  image_urls?: string[];
  size?: string;
  callback_url?: string;
  async?: boolean;
  model?: string;
  quality?: OpenAIImageQuality;
}

export interface IOpenAIImageGenerateRequest extends IOpenAIImageOutputConfig {
  action?: 'generate' | 'edit';
  model?: string;
  prompt?: string;
  size?: string;
  image_urls?: string[];
  callback_url?: string;
  async?: boolean;
  background?: 'transparent' | 'opaque' | 'auto';
  quality?: OpenAIImageQuality;
}

export interface IOpenAIImageEditRequest extends IOpenAIImageOutputConfig {
  action?: 'generate' | 'edit';
  model?: string;
  prompt?: string;
  size?: string;
  image_urls?: string[];
  callback_url?: string;
  async?: boolean;
  quality?: OpenAIImageQuality;
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
  elapsed?: number;
  request?: IOpenAIImageGenerateRequest | IOpenAIImageEditRequest;
  response?: IOpenAIImageGenerateResponse;
}

export type IOpenAIImageTaskResponse = IOpenAIImageTask;

export interface IOpenAIImageTasksResponse {
  count: number;
  items: IOpenAIImageTask[];
}
