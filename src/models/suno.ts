export interface ISunoConfig {
  prompt?: string;
  model?: string;
  lyric?: string;
  custom?: boolean;
  instrumental?: boolean;
  title?: string;
  style?: string;
  action?: string;
}

export interface ISunoAudioRequest {
  action?: string;
  prompt?: string;
  model?: string;
  lyric?: string;
  custom?: boolean;
  title?: string;
  style?: string;
}

export interface ISunoLyricRequest {
  prompt?: string;
}

export interface ISunoAudio {
  id: string;
  lyric?: string;
  model?: string;
  style?: string;
  title?: string;
  prompt?: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
  created_at?: string;
}

export interface ISunoAudioLyric {
  text: string;
  title: string;
}

export interface ISunoAudioResponse {
  success?: boolean;
  task_id: string;
  data: ISunoAudio[];
}

export interface ISunoLyricResponse {
  success?: boolean;
  task_id: string;
  data: ISunoAudioLyric;
}

export interface ISunoTask {
  id: string;
  created_at?: string;
  request?: ISunoAudioRequest | ISunoLyricRequest;
  response?: ISunoAudioResponse | ISunoLyricResponse;
}

export type ISunoTaskResponse = ISunoTask;

export interface ISunoTasksResponse {
  count: number;
  items: ISunoTask[];
}
