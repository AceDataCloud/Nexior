export type IKlingCameraType = 'simple' | 'down_back' | 'forward_up' | 'left_turn_forward' | 'right_turn_forward';

export interface IKlingCameraControlConfig {
  horizontal?: number;
  vertical?: number;
  pan?: number;
  tilt?: number;
  roll?: number;
  zoom?: number;
}

export interface IKlingCameraControl {
  type?: IKlingCameraType;
  config?: IKlingCameraControlConfig;
}

export interface IKlingReferenceVideo {
  video_url?: string;
  refer_type?: 'feature' | 'base';
  keep_original_sound?: 'yes' | 'no';
}

export interface IKlingElementRef {
  element_id?: string;
}

export interface IKlingConfig {
  action?: string;
  mode?: string;
  model?: string;
  video_id?: string;
  video_url?: string;
  prompt?: string;
  custom?: boolean;
  start_image_url?: string;
  end_image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: number;
  camera_control?: IKlingCameraControl;
  cfg_scale?: number;
  callback_url?: string;
  generate_audio?: boolean;
  element_list?: IKlingElementRef[];
  video_list?: IKlingReferenceVideo[];
}

export interface IKlingGenerateRequest {
  action?: string;
  mode?: string;
  model?: string;
  video_id?: string;
  prompt?: string;
  start_image_url?: string;
  end_image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: number;
  camera_control?: IKlingCameraControl;
  cfg_scale?: number;
  callback_url?: string;
  generate_audio?: boolean;
  element_list?: IKlingElementRef[];
  video_list?: IKlingReferenceVideo[];
}
export interface IKlingVideo {
  id?: string;
  video_url?: string;
  video_id?: string;
  duration?: number;
  state?: string;
  action?: string;
}
export interface IKlingGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  video_url?: string;
  video_id?: string;
  duration?: number;
  state?: string;
  action?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IKlingTask {
  id: string;
  created_at?: number;
  request?: IKlingGenerateRequest;
  response?: IKlingGenerateResponse;
}

export type IKlingTaskResponse = IKlingTask;

export interface IKlingTasksResponse {
  count: number;
  items: IKlingTask[];
}
