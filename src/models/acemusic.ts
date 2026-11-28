export type AcemusicModel = 'acemusic-v1.1' | 'acemusic-v1';
export type AcemusicAction = 'generate' | 'upload' | 'cover' | 'mashup';
export const ACEMUSIC_ASSET_TYPES = ['midi', 'image', 'video'] as const;
export type AcemusicAssetType = (typeof ACEMUSIC_ASSET_TYPES)[number];
export interface IAcemusicAsset {
  id: string;
  type: AcemusicAssetType;
  name: string;
  status: 'available' | 'expired';
  expires_at?: number;
  duration_seconds?: number;
}
export interface IAcemusicAssetUpload {
  action: 'upload';
  type: AcemusicAssetType;
  url: string;
  name?: string;
  async: true;
}
export interface IAcemusicConfig {
  asset_id?: string;
  asset_type?: AcemusicAssetType;
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
  operation: 'audios' | 'lyrics' | 'assets';
  taskId?: string;
  request: IAcemusicAudioRequest | IAcemusicAssetUpload | { prompt: string; style?: string };
}
