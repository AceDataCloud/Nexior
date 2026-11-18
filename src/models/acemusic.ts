export type AcemusicModel = 'acemusic-v1.1' | 'acemusic-v1';
export type AcemusicAction = 'generate' | 'upload' | 'cover' | 'mashup';
export interface IAcemusicConfig {
  action?: AcemusicAction;
  audio_url?: string;
  name?: string;
  audio_id?: string;
  mashup_audio_ids?: string[];
  audio_influence?: number;
  model: AcemusicModel;
  custom: boolean;
  prompt?: string;
  lyric?: string;
  title?: string;
  style?: string;
}
export interface IAcemusicAudioRequest extends Partial<IAcemusicConfig> {
  action: AcemusicAction;
  async: true;
}
export interface IAcemusicAudio {
  id: string;
  state?: string;
  model?: string;
  title?: string;
  lyric?: string;
  style?: string;
  duration?: number;
  audio_url?: string;
  image_url?: string;
  created_at?: string;
  volume?: number;
  progress?: number;
  object?: HTMLAudioElement;
}
export interface IAcemusicResponse {
  status?: string;
  success?: boolean;
  state?: string;
  task_id?: string;
  trace_id?: string;
  data?: IAcemusicAudio[];
  error?: string | { code?: string; message?: string };
}
export interface IAcemusicTask {
  status?: string;
  id: string;
  state?: string;
  created_at?: number;
  trace_id?: string;
  request?: IAcemusicAudioRequest;
  response?: IAcemusicResponse;
}
export interface IAcemusicTaskFilter {
  ids?: string[];
  limit?: number;
  offset?: number;
  createdAtMin?: number;
  createdAtMax?: number;
}

export interface IAcemusicSubmission {
  key: string;
  scope: string;
  operation: 'audios' | 'lyrics';
  request: IAcemusicAudioRequest | { prompt: string; style?: string };
}
