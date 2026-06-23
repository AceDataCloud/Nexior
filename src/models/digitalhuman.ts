export type IDigitalHumanEngine = 'latentsync' | 'heygem';
export type IDigitalHumanResolution = '720p' | '540p';
export type IDigitalHumanLang = 'zh' | 'en';

export interface IDigitalHumanConfig {
  // face source — one of video_url (preferred) / image_url
  video_url?: string;
  image_url?: string;
  // voice source — audio_url, or text + voice_id (cloned)
  audio_url?: string;
  text?: string;
  voice_id?: string;
  // options
  engine?: IDigitalHumanEngine;
  resolution?: IDigitalHumanResolution;
  speed?: number;
  callback_url?: string;
  async?: boolean;
}

export type IDigitalHumanGenerateRequest = {
  video_url?: string;
  image_url?: string;
  audio_url?: string;
  text?: string;
  voice_id?: string;
  engine?: IDigitalHumanEngine;
  resolution?: IDigitalHumanResolution;
  speed?: number;
  callback_url?: string;
  async?: boolean;
};

// Flat single-poll / history `response` shape (matches the worker `public()` view).
export interface IDigitalHumanGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  state?: string;
  progress?: number;
  video_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  engine?: string;
  voice_id?: string;
  error?:
    | string
    | {
        code?: string;
        message?: string;
      };
}

export interface IDigitalHumanVoiceRequest {
  audio_url: string;
  lang?: IDigitalHumanLang;
  name?: string;
  async?: boolean;
}

export interface IDigitalHumanVoiceResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  state?: string;
  voice_id?: string;
  error?:
    | string
    | {
        code?: string;
        message?: string;
      };
}

export interface IDigitalHumanTask {
  id: string;
  status?: string;
  kind?: string;
  created_at?: number;
  elapsed?: number;
  request?: IDigitalHumanGenerateRequest;
  response?: IDigitalHumanGenerateResponse;
}

export type IDigitalHumanTaskResponse = IDigitalHumanTask;

export interface IDigitalHumanTasksResponse {
  count: number;
  items: IDigitalHumanTask[];
}
