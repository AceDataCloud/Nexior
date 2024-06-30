export interface IQrartConfig {
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

export interface IQrartGenerateRequest {
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

export interface IQrartGenerateResponse {
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

export interface IQrartTask {
  id: string;
  created_at?: string;
  request?: IQrartGenerateRequest;
  response?: IQrartGenerateResponse;
}

export type IQrartTaskResponse = IQrartTask;

export interface IQrartTasksResponse {
  count: number;
  items: IQrartTask[];
}
