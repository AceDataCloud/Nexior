export type SeedanceImageRole = 'first_frame' | 'last_frame' | 'reference_image';

export interface ISeedanceImageInput {
  url: string;
  role?: SeedanceImageRole;
}

export type SeedanceResolution = '480p' | '720p' | '1080p';
export type SeedanceRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | 'adaptive';

export interface ISeedanceConfig {
  model?: string;
  prompt?: string;
  images?: ISeedanceImageInput[];
  duration?: number;
  resolution?: SeedanceResolution;
  ratio?: SeedanceRatio;
  seed?: number;
  camerafixed?: boolean;
  generate_audio?: boolean;
  service_tier?: 'default' | 'flex';
  return_last_frame?: boolean;
  execution_expires_after?: number;
  callback_url?: string;
  async?: boolean;
  mirror?: boolean;
}

export interface ISeedanceGenerateRequest {
  model?: string;
  prompt?: string;
  images?: ISeedanceImageInput[];
  duration?: number;
  resolution?: SeedanceResolution;
  ratio?: SeedanceRatio;
  seed?: number;
  camerafixed?: boolean;
  generate_audio?: boolean;
  service_tier?: 'default' | 'flex';
  return_last_frame?: boolean;
  execution_expires_after?: number;
  callback_url?: string;
  async?: boolean;
  mirror?: boolean;
}

export interface ISeedanceVideo {
  task_id?: string;
  status?: string;
  video_url?: string;
  last_frame_url?: string;
  model?: string;
  prompt?: string;
  duration?: number;
  resolution?: string;
  ratio?: string;
  framespersecond?: number;
}

export interface ISeedanceGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: ISeedanceVideo;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ISeedanceTask {
  id: string;
  created_at?: number;
  elapsed?: number;
  request?: ISeedanceGenerateRequest;
  response?: ISeedanceGenerateResponse;
}

export type ISeedanceTaskResponse = ISeedanceTask;

export interface ISeedanceTasksResponse {
  count: number;
  items: ISeedanceTask[];
}
