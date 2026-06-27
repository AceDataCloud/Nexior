export type GrokVideoResolution = '480p' | '720p' | '1080p';
export type GrokVideoRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';

export interface IGrokVideoConfig {
  model?: string;
  prompt?: string;
  image_url?: string;
  reference_image_urls?: string[];
  aspect_ratio?: GrokVideoRatio;
  resolution?: GrokVideoResolution;
  duration?: number;
  callback_url?: string;
  async?: boolean;
  mirror?: boolean;
}

export interface IGrokVideoGenerateRequest {
  model?: string;
  prompt?: string;
  image_url?: string;
  reference_image_urls?: string[];
  aspect_ratio?: GrokVideoRatio;
  resolution?: GrokVideoResolution;
  duration?: number;
  callback_url?: string;
  async?: boolean;
  mirror?: boolean;
}

export interface IGrokVideoVideo {
  id?: string;
  task_id?: string;
  state?: string;
  status?: string;
  video_url?: string;
  duration?: number;
}

export interface IGrokVideoGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IGrokVideoVideo[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IGrokVideoTask {
  id: string;
  created_at?: number;
  elapsed?: number;
  request?: IGrokVideoGenerateRequest;
  response?: IGrokVideoGenerateResponse;
}

export type IGrokVideoTaskResponse = IGrokVideoTask;

export interface IGrokVideoTasksResponse {
  count: number;
  items: IGrokVideoTask[];
}
