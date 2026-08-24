export interface IQwenImageConfig {
  model?: string;
  prompt?: string;
  image?: string[];
  size?: string;
  n?: number;
  seed?: number;
  prompt_extend?: boolean;
  enable_thinking?: boolean;
  watermark?: boolean;
  callback_url?: string;
  async?: boolean;
}
export interface IQwenImageGenerateRequest extends Omit<IQwenImageConfig, 'image'> {
  image_urls?: string[];
}
export interface IQwenImageImage {
  image_url?: string;
}
export interface IQwenImageGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IQwenImageImage[];
  error?: { code?: string; message?: string };
}
export interface IQwenImageTask {
  id: string;
  created_at?: number;
  elapsed?: number;
  request?: IQwenImageGenerateRequest;
  response?: IQwenImageGenerateResponse;
}
export type IQwenImageTaskResponse = IQwenImageTask;
export interface IQwenImageTasksResponse {
  count: number;
  items: IQwenImageTask[];
}
