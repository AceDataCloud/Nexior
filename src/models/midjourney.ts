export interface IMidjourneyConfig {
  mode?: string;
  prompt?: string;
  action?: string;
  video_id?: string;
  video_url?: string;
  image_url?: string;
  is_videos?: boolean;
  model?: string;
  ratio?: string;
  version?: string;
  stylize?: number;
  chaos?: number;
  advanced?: boolean;
  quality?: string;
  weird?: number;
  iw?: number;
  ignore?: string;
  style?: string;
  references?: string[];
  translation?: boolean;
  elements?: any[];
  active_tab?: string;
}

export enum MidjourneyImagineAction {
  GENERATE = 'generate',
  UPSCALE1 = 'upscale1',
  UPSCALE2 = 'upscale2',
  UPSCALE3 = 'upscale3',
  UPSCALE4 = 'upscale4',
  VARIATION1 = 'variation1',
  VARIATION2 = 'variation2',
  VARIATION3 = 'variation3',
  VARIATION4 = 'variation4',
  VARIATION_STRONG = 'variation_strong',
  VARIATION_SUBTLE = 'variation_subtle',
  UPSCALE_SUBTLE = 'upscale_subtle',
  UPSCALE_CREATIVE = 'upscale_creative',
  ZOOM_OUT_2X = 'zoom_out_2x',
  ZOOM_OUT_1_5X = 'zoom_out_1_5x',
  SQUARE = 'square',
  PAN_LEFT = 'pan_left',
  PAN_UP = 'pan_up',
  PAN_DOWN = 'pan_down',
  PAN_RIGHT = 'pan_right',
  REROLL = 'reroll',
  UPSCALE_2X = 'upscale_2x',
  UPSCALE_4X = 'upscale_4x',
  REDO_UPSCALE_2X = 'redo_upscale_2x',
  REDO_UPSCALE_4X = 'redo_upscale_4x',
  REDO_UPSCALE_SUBTLE = 'redo_upscale_subtle',
  REDO_UPSCALE_CREATIVE = 'redo_upscale_creative'
}
export enum MidjourneyVideosAction {
  GENERATE = 'generate',
  EXTEND = 'extend'
}

export enum MidjourneyImagineState {
  PENDING = 'pending',
  GENERATING = 'generating',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export interface IMidjourneyImagineRequest {
  action?: MidjourneyImagineAction;
  mode?: string;
  prompt?: string;
  image_id?: string;
  translation?: boolean;
  callback_url?: string;
  application_id?: string;
}

export interface IMidjourneyVideosRequest {
  action?: MidjourneyVideosAction;
  mode?: string;
  prompt?: string;
  video_id?: string;
  image_url?: string;
  callback_url?: string;
  application_id?: string;
}

export interface IMidjourneyDescribeRequest {
  image_url: string;
  application_id?: string;
}

export interface IMidjourneyImagineResponse {
  task_id: string;
  progress: number;
  image_id: string;
  image_url: string;
  trace_id: string;
  raw_image_url: string;
  actions: MidjourneyImagineAction[];
  error?: {
    code?: string;
    message?: string;
  };
  success?: boolean;
}

export interface IMidjourneyVideosResponse {
  task_id: string;
  type: 'videos';
  progress?: number;
  image_width?: number;
  image_height?: number;
  video_id?: string;
  trace_id: string;
  video_urls?: string[];
  error?: {
    code?: string;
    message?: string;
  };
  success?: boolean;
}

export interface IMidjourneyDescribeResponse {
  descriptions: string[];
}

export interface IMidjourneyImagineTask {
  id: string;
  type: 'imagine';
  created_at?: number;
  trace_id?: string;
  request?: IMidjourneyImagineRequest;
  response?: IMidjourneyImagineResponse;
  state?: MidjourneyImagineState;
}
export interface IMidjourneyVideosTask {
  id: string;
  type: 'videos';
  created_at?: number;
  trace_id?: string;
  request?: IMidjourneyVideosRequest;
  response?: IMidjourneyVideosResponse;
  state?: MidjourneyImagineState;
}

export interface IMidjourneyDescribeTask {
  id: string;
  type: 'describe';
  created_at?: number;
  request?: IMidjourneyDescribeRequest;
  response?: IMidjourneyDescribeResponse;
}

export type IMidjourneyTask = IMidjourneyImagineTask | IMidjourneyDescribeTask | IMidjourneyVideosTask;

export type IMidjourneyTaskResponse = IMidjourneyTask;

export interface IMidjourneyTasksResponse {
  items: IMidjourneyTask[];
  count: number;
}

export interface IMidjourneyImagineOptions {
  stream?: (response: IMidjourneyImagineResponse) => void;
  token?: string;
  endpoint?: string;
  path?: string;
}
