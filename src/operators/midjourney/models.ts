export interface IMidjourneyChannel {
  icon: string;
  apiId: string;
  name: string;
  displayName: string;
}

export interface IMidjourneyPreset {
  model?: string;
  ratio?: string;
  version?: string;
  stylize?: number;
  chaos?: number;
  advanced?: boolean;
  quality?: string;
  wired?: number;
  raw?: boolean;
  iw: number;
}

export enum MidjourneyImagineAction {
  GENERATE = 'generate',
  UPSAMPLE1 = 'upsample1',
  UPSAMPLE2 = 'upsample2',
  UPSAMPLE3 = 'upsample3',
  UPSAMPLE4 = 'upsample4',
  VARIATION1 = 'variation1',
  VARIATION2 = 'variation2',
  VARIATION3 = 'variation3',
  VARIATION4 = 'variation4',
  HIGH_VARIATION = 'high_variation',
  LOW_VARIATION = 'low_variation',
  ZOOM_OUT_2X = 'zoom_out_2x',
  ZOOM_OUT_1_5X = 'zoom_out_1_5x',
  SQUARE = 'square',
  PAN_LEFT = 'pan_left',
  PAN_UP = 'pan_up',
  PAN_DOWN = 'pan_down',
  PAN_RIGHT = 'pan_right',
  REROLL = 'reroll',
  UPSAMPLE_2X = 'upsample_2x',
  UPSAMPLE_4X = 'upsample_4x',
  REDO_UPSAMPLE_2X = 'redo_upsample_2x',
  REDO_UPSAMPLE_4X = 'redo_upsample_4x'
}

export enum MidjourneyImagineState {
  PENDING = 'pending',
  GENERATING = 'generating',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export interface IMidjourneyImagineRequest {
  action?: MidjourneyImagineAction;
  prompt?: string;
  image_id?: string;
}

export interface IMidjourneyImagineResponse {
  task_id: string;
  progress: number;
  image_id: string;
  image_url: string;
  raw_image_url: string;
  actions: MidjourneyImagineAction[];
  code?: string;
  detail?: string;
  success?: boolean;
}

export interface IMidjourneyImagineTask {
  request?: IMidjourneyImagineRequest;
  response?: IMidjourneyImagineResponse;
  state?: MidjourneyImagineState;
}

export interface IMidjourneyImagineOptions {
  stream?: (response: IMidjourneyImagineResponse) => void;
  token?: string;
  endpoint?: string;
  path?: string;
}
