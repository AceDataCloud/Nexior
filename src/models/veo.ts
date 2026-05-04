export interface IVeoConfig {
  action?: string;
  model?: string;
  video_id?: string;
  video_url?: string;
  translation?: boolean;
  aspect_ratio?: string;
  image_urls?: string[];
  prompt?: string;
  callback_url?: string;
  // /veo/upsample — sub-action: 1080p / 4k / gif
  upsample_action?: string;
  // /veo/reshoot — short uppercase motion-type alias
  motion_type?: string;
  // /veo/objects — base64-encoded JPEG or HTTP(S) URL to a mask image
  image_mask?: string;
}

export interface IVeoGenerateRequest {
  action?: string;
  model?: string;
  video_id?: string;
  video_url?: string;
  image_urls?: string[];
  prompt?: string;
  translation?: boolean;
  aspect_ratio?: string;
  callback_url?: string;
  mirror?: boolean;
  // /veo/upsample
  upsample_action?: string;
  // /veo/reshoot
  motion_type?: string;
  // /veo/objects
  image_mask?: string;
}
export interface IVeoVideo {
  id?: string;
  video_url?: string;
  state?: string;
  created_at?: string;
  complete_at?: string;
}
export interface IVeoGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IVeoVideo[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IVeoTask {
  id: string;
  created_at?: number;
  request?: IVeoGenerateRequest;
  response?: IVeoGenerateResponse;
}

export type IVeoTaskResponse = IVeoTask;

export interface IVeoTasksResponse {
  count: number;
  items: IVeoTask[];
}
