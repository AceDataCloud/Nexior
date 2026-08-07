export type IMinimaxMode = 'text_to_video' | 'image_to_video' | 'audio_guided';

export interface IMinimaxConfig {
  model: 'minimax-h3';
  prompt?: string;
  image_urls?: string[];
  audio_urls?: string[];
  resolution: '768P' | '2K';
  ratio: '16:9' | '9:16';
  duration: number;
  aigc_watermark: boolean;
  callback_url?: string;
  async?: boolean;
}

export type IMinimaxGenerateRequest = IMinimaxConfig;

export interface IMinimaxVideo {
  id?: string;
  video_url?: string;
  model?: string;
  mode?: IMinimaxMode;
  state?: string;
  duration?: number;
  ratio?: string;
  resolution?: string;
}

export interface IMinimaxGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id: string;
  data?: IMinimaxVideo[];
  error?: { code?: string; message?: string };
}

export interface IMinimaxTask {
  id: string;
  created_at?: number;
  elapsed?: number;
  request?: IMinimaxGenerateRequest;
  response?: IMinimaxGenerateResponse;
}

export type IMinimaxTaskResponse = IMinimaxTask;
export interface IMinimaxTasksResponse {
  count: number;
  items: IMinimaxTask[];
}
