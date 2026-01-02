export interface ISeedreamConfig {
  model?: string;
  prompt?: string;
  image?: string[];
  size?: string;
  seed?: number;
  sequential_image_generation?: 'auto' | 'disabled';
  stream?: boolean;
  guidance_scale?: number;
  response_format?: 'url' | 'b64_json';
  watermark?: boolean;
  callback_url?: string;
}

export interface ISeedreamGenerateRequest {
  model?: string;
  prompt?: string;
  image?: string[];
  size?: string;
  seed?: number;
  sequential_image_generation?: 'auto' | 'disabled';
  stream?: boolean;
  guidance_scale?: number;
  response_format?: 'url' | 'b64_json';
  watermark?: boolean;
  callback_url?: string;
}

export interface ISeedreamImage {
  prompt?: string;
  size?: string;
  image_url?: string;
}

export interface ISeedreamGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: ISeedreamImage[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ISeedreamTask {
  id: string;
  created_at?: number;
  request?: ISeedreamGenerateRequest;
  response?: ISeedreamGenerateResponse;
}

export type ISeedreamTaskResponse = ISeedreamTask;

export interface ISeedreamTasksResponse {
  count: number;
  items: ISeedreamTask[];
}
