export interface ISeedreamSequentialOptions {
  max_images?: number;
}

export interface ISeedreamConfig {
  action?: 'generate' | 'edit';
  model?: string;
  prompt?: string;
  image?: string | string[];
  layer_decomposition?: boolean;
  background?: 'transparent' | 'opaque';
  optimize_prompt_options?: { mode: 'standard' | 'fast' };
  tools?: Array<{ type: 'web_search' }>;
  size?: string;
  seed?: number;
  sequential_image_generation?: 'auto' | 'disabled';
  sequential_image_generation_options?: ISeedreamSequentialOptions;
  stream?: boolean;
  guidance_scale?: number;
  response_format?: 'url' | 'b64_json';
  watermark?: boolean;
  output_format?: 'jpeg' | 'png';
  callback_url?: string;
  async?: boolean;
}

export interface ISeedreamGenerateRequest {
  model?: string;
  prompt?: string;
  image?: string | string[];
  layer_decomposition?: boolean;
  background?: 'transparent' | 'opaque';
  optimize_prompt_options?: { mode: 'standard' | 'fast' };
  tools?: Array<{ type: 'web_search' }>;
  size?: string;
  seed?: number;
  sequential_image_generation?: 'auto' | 'disabled';
  sequential_image_generation_options?: ISeedreamSequentialOptions;
  stream?: boolean;
  guidance_scale?: number;
  response_format?: 'url' | 'b64_json';
  watermark?: boolean;
  output_format?: 'jpeg' | 'png';
  callback_url?: string;
  async?: boolean;
}

export interface ISeedreamImage {
  prompt?: string;
  size?: string;
  image_url?: string;
  b64_json?: string;
  output_format?: 'jpeg' | 'png';
  z_index?: number;
  name?: string;
  description?: string;
  bounding_box?: {
    absolute?: [number, number, number, number];
    normalized?: [number, number, number, number];
  };
  error?: { code?: string; message?: string };
}

export interface ISeedreamGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: ISeedreamImage[];
  usage?: Record<string, unknown>;
  tools?: Array<{ type: string }>;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ISeedreamTask {
  id: string;
  created_at?: number;
  elapsed?: number;
  request?: ISeedreamGenerateRequest;
  response?: ISeedreamGenerateResponse;
}

export type ISeedreamTaskResponse = ISeedreamTask;

export interface ISeedreamTasksResponse {
  count: number;
  items: ISeedreamTask[];
}
