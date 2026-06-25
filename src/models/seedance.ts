export type SeedanceImageRole = 'first_frame' | 'last_frame' | 'reference_image';

export interface ISeedanceImageInput {
  url: string;
  role?: SeedanceImageRole;
}

export interface ISeedanceMediaInput {
  url: string;
}

/** Native multimodal content item forwarded to /seedance/videos when a request
 * carries reference audio or video (the flat images[] path is image-only). */
export interface ISeedanceContentItem {
  type: 'text' | 'image_url' | 'audio_url' | 'video_url';
  text?: string;
  role?: SeedanceImageRole;
  image_url?: { url: string };
  audio_url?: { url: string };
  video_url?: { url: string };
}

export type SeedanceResolution = '480p' | '720p' | '1080p' | '4k';
export type SeedanceRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | 'adaptive';

export interface ISeedanceConfig {
  model?: string;
  prompt?: string;
  images?: ISeedanceImageInput[];
  audios?: ISeedanceMediaInput[];
  videos?: ISeedanceMediaInput[];
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
  audios?: ISeedanceMediaInput[];
  videos?: ISeedanceMediaInput[];
  content?: ISeedanceContentItem[];
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
