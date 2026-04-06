export interface IProducerConfig {
  prompt?: string;
  model?: string;
  lyric?: string;
  custom?: boolean;
  instrumental?: boolean;
  title?: string;
  style?: string;
  action?: string;
  audio?: IProducerAudio | undefined;
  audio_id?: string;
  continue_at: number;
  sound_strength?: number;
  lyrics_strength?: number;
  weirdness?: number;
  seed?: number;
  vocal_gender?: string;
  replace_section_start?: number;
  replace_section_end?: number;
  style_negative?: string;
  lyric_prompt?: string;
}

export interface IProducerAudioRequest {
  action?: string;
  prompt?: string;
  model?: string;
  lyric?: string;
  custom?: boolean;
  title?: string;
  style?: string;
  audio_id?: string;
  continue_at?: number;
  sound_strength?: number;
  lyrics_strength?: number;
  weirdness?: number;
  seed?: number;
  callback_url?: string;
  instrumental?: boolean;
  vocal_gender?: string;
  replace_section_start?: number;
  replace_section_end?: number;
  style_negative?: string;
  lyric_prompt?: string;
}

export interface IProducerVideoRequest {
  audio_id?: string;
}

export interface IProducerLyricRequest {
  prompt?: string;
}

export interface IProducerUploadRequest {
  audio_url?: string;
}

export interface IProducerAudio {
  id?: string;
  action?: string;
  lyric?: string;
  volume?: number;
  progress?: number;
  model?: string;
  style?: string;
  title?: string;
  prompt?: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
  created_at?: string;
  duration?: number;
  state?: 'playing' | 'paused';
  object?: any;
}

export interface IProducerAudioLyric {
  text?: string;
  title?: string;
}

export interface IProducerUploadAudio {
  audio_id?: string;
}

export interface IProducerVideo {
  video_url?: string;
}

export interface IProducerAudioResponse {
  success?: boolean;
  task_id: string;
  data: IProducerAudio[];
}

export interface IProducerLyricResponse {
  success?: boolean;
  task_id: string;
  data: IProducerAudioLyric;
}

export interface IProducerUploadResponse {
  success?: boolean;
  task_id: string;
  data: IProducerUploadAudio;
}

export interface IProducerVideoResponse {
  success?: boolean;
  task_id: string;
  data: IProducerVideo;
}

export interface IProducerTask {
  map(arg0: (song: any) => any): any;
  id: string;
  created_at?: number;
  request?: IProducerAudioRequest | IProducerLyricRequest;
  response?: IProducerAudioResponse | IProducerLyricResponse;
}

export type IProducerTaskResponse = IProducerTask;

export interface IProducerTasksResponse {
  count: number;
  items: IProducerTask[];
}
