export type IMinimaxRatio = 'adaptive' | '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
export type IMinimaxMediaRole =
  | 'first_frame'
  | 'last_frame'
  | 'reference_image'
  | 'reference_video'
  | 'reference_audio';

export type IMinimaxContentItem =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string }; role?: IMinimaxMediaRole }
  | { type: 'video_url'; video_url: { url: string }; role: 'reference_video' }
  | { type: 'audio_url'; audio_url: { url: string }; role: 'reference_audio' };

export interface IMinimaxConfig {
  model: 'MiniMax-H3';
  content: IMinimaxContentItem[];
  resolution: '768P' | '2K';
  ratio?: IMinimaxRatio;
  duration: number;
  aigc_watermark?: boolean;
  callback_url?: string;
}

export type IMinimaxGenerateRequest = IMinimaxConfig;

export interface IMinimaxGenerateResponse {
  task_id: string;
}

export interface IMinimaxTaskUsage {
  total_seconds?: number;
  input_seconds?: number;
  output_seconds?: number;
  input_image_count?: number;
}

export interface IMinimaxVideoTask {
  id: string;
  model: 'MiniMax-H3';
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  error?: { code?: string; message?: string };
  created_at?: number;
  updated_at?: number;
  content?: { url?: string };
  resolution?: '768P' | '2K';
  duration?: number;
  usage?: IMinimaxTaskUsage;
  ratio?: string;
  task_type: 'generation';
  modality: 'video';
}

export interface IMinimaxTask {
  task: IMinimaxVideoTask;
}

export type IMinimaxTaskResponse = IMinimaxTask;
export interface IMinimaxTasksResponse {
  total: number;
  items: IMinimaxVideoTask[];
}
