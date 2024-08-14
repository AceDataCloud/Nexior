export interface ILumaConfig {
  content?: string;
  content_image_url?: string;
  type: string;
  prompt: string;
  pattern?: string;
  preset?: string;
  steps?: number;
  qrw?: number;
  seed?: number;
  advanced?: boolean;
  rawurl?: boolean;
  padding_level?: number;
  aspect_ratio?: number;
  position?: string;
  pixel_style?: string;
  marker_shape?: string;
  sub_marker?: string;
  rotate?: number;
  ecl?: string;
  padding_noise?: number;
}

export interface ILumaGenerateRequest {
  content?: string;
  content_image_url?: string;
  type: string;
  prompt: string;
  pattern?: string;
  preset?: string;
  steps?: number;
  qrw?: number;
  seed?: number;
  rawurl?: boolean;
  padding_level?: number;
  aspect_ratio?: number;
  position?: string;
  pixel_style?: string;
  marker_shape?: string;
  sub_marker?: string;
  rotate?: number;
  ecl?: string;
  padding_nose?: number;
}

export interface ILumaGenerateResponse {
  image_url: string;
  image_width: number;
  image_height: number;
  seed: number;
  success: boolean;
  trace_id: string;
  error: {
    code?: string;
    message?: string;
  };
}

export interface ILumaTask {
  id: string;
  created_at?: string;
  request?: ILumaGenerateRequest;
  response?: ILumaGenerateResponse;
}

export type ILumaTaskResponse = ILumaTask;

export interface ILumaTasksResponse {
  count: number;
  items: ILumaTask[];
}
