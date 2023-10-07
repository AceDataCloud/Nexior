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
  stylize?: string;
  chaos?: string;
}

export enum MidjourneyImagineAction {
  GENERATE = 'generate',
  UPSAMPLE1 = 'upsample1'
}

export enum MidjourneyImagineState {
  PENDING = 'pending',
  GENERATING = 'generating',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export interface IMidjourneyImagineRequest {
  action: MidjourneyImagineAction;
  prompt: string;
  image_id?: string;
}

export interface IMidjourneyImagineResponse {
  task_id: string;
  progress: number;
  image_id: string;
  image_url: string;
  actions: MidjourneyImagineAction[];
}

export interface IMidjourneyImagineOptions {
  stream?: (response: IMidjourneyImagineResponse) => void;
  token: string;
  endpoint: string;
  path: string;
}
