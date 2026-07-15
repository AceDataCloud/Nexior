export type OmniResolution = '720p' | '1080p';
export type OmniRatio = '16:9' | '9:16';

export interface IOmniConfig {
  model?: string;
  prompt?: string;
  image_urls?: string[];
  video_urls?: string[];
  aspect_ratio?: OmniRatio;
  resolution?: OmniResolution;
  callback_url?: string;
  async?: boolean;
}

export interface IOmniGenerateRequest {
  model?: string;
  prompt?: string;
  image_urls?: string[];
  video_urls?: string[];
  aspect_ratio?: OmniRatio;
  resolution?: OmniResolution;
  callback_url?: string;
  async?: boolean;
}

export interface IOmniVideo {
  id?: string;
  task_id?: string;
  state?: string;
  status?: string;
  video_url?: string;
  aspect_ratio?: string;
  prompt?: string;
}

export interface IOmniGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IOmniVideo[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IOmniTask {
  id: string;
  created_at?: number;
  elapsed?: number;
  request?: IOmniGenerateRequest;
  response?: IOmniGenerateResponse;
}

export type IOmniTaskResponse = IOmniTask;

export interface IOmniTasksResponse {
  count: number;
  items: IOmniTask[];
}
