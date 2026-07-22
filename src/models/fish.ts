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
  async?: boolean;
}

export interface IFishTtsResponse {
  task_id?: string;
  trace_id?: string;
  started_at?: number;
  audio_url?: string;
  success?: boolean;
  // Fish-native failure shape (worker `sendFailureResult`): the record is
  // persisted as `{status, message, task_id, trace_id}` with NO `success`
  // or `error` field, so the UI must key failure off `status`/`message` too.
  status?: number | string;
  message?: string;
  error?:
    | string
    | {
        code?: string;
        message?: string;
      };
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
  // Fish-audio's MongoDB document id is sometimes surfaced verbatim by the
  // platform proxy; treat it as an alias for `id` in the UI.
  _id?: string;
  // Some responses include a separate `reference_id` (the one the /fish/tts
  // endpoint actually consumes); we fall back to it when `id` is empty.
  reference_id?: string;
  title?: string;
  description?: string;
  cover_image?: string;
  visibility?: string;
  type?: string;
  state?: string;
  created_at?: number | string;
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
