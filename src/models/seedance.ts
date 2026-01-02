export type SeedanceImageRole = 'first_frame' | 'last_frame' | 'reference_image';

export interface ISeedanceImageInput {
  url: string;
  role?: SeedanceImageRole;
}

export interface ISeedanceConfig {
  model?: string;
  prompt?: string;
  images?: ISeedanceImageInput[];
  service_tier?: 'default' | 'flex';
  return_last_frame?: boolean;
  execution_expires_after?: number;
  callback_url?: string;
  mirror?: boolean;
}

export interface ISeedanceGenerateRequest {
  model?: string;
  prompt?: string;
  images?: ISeedanceImageInput[];
  service_tier?: 'default' | 'flex';
  return_last_frame?: boolean;
  execution_expires_after?: number;
  callback_url?: string;
  mirror?: boolean;
}

export interface ISeedanceVideo {
  task_id?: string;
  status?: string;
  video_url?: string;
  last_frame_url?: string;
  model?: string;
  prompt?: string;
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
  request?: ISeedanceGenerateRequest;
  response?: ISeedanceGenerateResponse;
}

export type ISeedanceTaskResponse = ISeedanceTask;

export interface ISeedanceTasksResponse {
  count: number;
  items: ISeedanceTask[];
}
