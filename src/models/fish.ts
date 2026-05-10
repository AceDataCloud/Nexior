export type IFishTtsModel = 's1' | 's2-pro';
export type IFishTtsFormat = 'mp3' | 'wav' | 'opus';
export type IFishTtsLatency = 'normal' | 'balanced';

export interface IFishProsody {
  speed?: number;
  volume?: number;
  normalize_loudness?: boolean;
}

export interface IFishTtsRequest {
  text?: string;
  reference_id?: string;
  model?: IFishTtsModel;
  prosody?: IFishProsody;
  format?: IFishTtsFormat;
  latency?: IFishTtsLatency;
  callback_url?: string;
}

export interface IFishTtsResponse {
  task_id?: string;
  trace_id?: string;
  started_at?: number;
  audio_url?: string;
}

export interface IFishTtsConfig {
  text?: string;
  reference_id?: string;
  model?: IFishTtsModel;
  prosody?: IFishProsody;
  format?: IFishTtsFormat;
}

export interface IFishTask {
  id: string;
  type?: string;
  created_at?: number;
  elapsed?: number;
  request?: IFishTtsRequest;
  response?: IFishTtsResponse;
}

export type IFishTaskResponse = IFishTask;

export interface IFishTasksResponse {
  count: number;
  items: IFishTask[];
}

export interface IFishVoiceModel {
  id?: string;
  title?: string;
  description?: string;
  cover_image?: string;
  visibility?: string;
  type?: string;
  state?: string;
  created_at?: number;
  samples?: Array<{
    title?: string;
    text?: string;
    audio?: string;
  }>;
}

export interface IFishModelListResponse {
  total?: number;
  items: IFishVoiceModel[];
  has_more?: boolean;
}
