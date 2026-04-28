export interface Song {
  id?: string;
  audio_url?: string;
  created_at?: string;
  image_url?: string;
  lyric?: string;
  video_url?: string;
  model?: string;
  prompt?: string;
  style?: string;
  title?: string;
  duration?: number;
}

export interface PlayListDetail {
  task_id: string;
  name: string;
  coverImgId: number;
  coverImgUrl: string;
  coverImgId_str: string;
  adType: number;
  userId: number;
  createTime: number;
  status: number;
  opRecommend: boolean;
  highQuality: boolean;
  newImported: boolean;
  updateTime: number;
  trackCount: number;
  specialType: number;
  privacy: number;
  trackUpdateTime: number;
  commentThreadId: string;
  playCount: number;
  trackNumberUpdateTime: number;
  subscribedCount: number;
  cloudTrackCount: number;
  ordered: boolean;
  description: string;
  tags: string[];
  updateFrequency?: any;
  backgroundCoverId: number;
  backgroundCoverUrl?: any;
  titleImage: number;
  titleImageUrl?: any;
  englishTitle?: any;
  officialPlaylistType?: any;
  videoIds?: any;
  videos?: any;
  shareCount: number;
  commentCount: number;
  remixVideo?: any;
  sharedUsers?: any;
  historySharedUsers?: any;
}

export interface ISunoConfig {
  prompt?: string;
  model?: string;
  lyric?: string;
  lyric_prompt?: string;
  lyrics_mode?: string;
  custom?: boolean;
  instrumental?: boolean;
  title?: string;
  style?: string;
  style_negative?: string;
  action?: string;
  audio?: ISunoAudio | undefined;
  audio_id?: string;
  mashup_audio_ids?: string[];
  continue_at: number;
  vocal_gender?: string;
  weirdness?: number;
  style_influence?: number;
  variation_category?: string;
  audio_weight?: number;
  persona_id?: string;
  replace_section_start?: number;
  replace_section_end?: number;
  overpainting_start?: number;
  overpainting_end?: number;
  underpainting_start?: number;
  underpainting_end?: number;
  samples_start?: number;
  samples_end?: number;
  speed?: number;
}
export interface ISunoAudioRequest {
  action?: string;
  prompt?: string;
  model?: string;
  lyric?: string;
  lyric_prompt?: string;
  lyrics_mode?: string;
  custom?: boolean;
  title?: string;
  style?: string;
  style_negative?: string;
  vocal_gender?: string;
  weirdness?: number;
  style_influence?: number;
  variation_category?: string;
  audio_weight?: number;
  persona_id?: string;
  audio_id?: string;
  mashup_audio_ids?: string[];
  continue_at?: number;
  replace_section_start?: number;
  replace_section_end?: number;
  overpainting_start?: number;
  overpainting_end?: number;
  underpainting_start?: number;
  underpainting_end?: number;
  samples_start?: number;
  samples_end?: number;
  speed?: number;
  callback_url?: string;
  instrumental?: boolean;
}

export interface ISunoMp4Request {
  callback_url?: string;
  audio_id?: string;
}

export interface ISunoLyricRequest {
  prompt?: string;
}

export interface ISunoUploadRequest {
  audio_url?: string;
}

export interface ISunoAudio {
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

export interface ISunoAudioLyric {
  text?: string;
  title?: string;
}

export interface ISunoStyleRequest {
  prompt?: string;
}

export interface ISunoStyleResponse {
  text?: string;
}

export interface ISunoPersonaRequest {
  audio_id: string;
  name: string;
  vox_audio_id?: string;
  vocal_start?: number;
  vocal_end?: number;
  description?: string;
}

export interface ISunoPersona {
  id?: string;
  persona_id?: string;
  name?: string;
  description?: string;
  source_type?: 'persona' | 'voice';
  source_audio_id?: string;
  source_audio_url?: string;
  user_id?: string;
  task_id?: string;
  created_at?: number;
}

export interface ISunoPersonaResponse {
  success?: boolean;
  task_id: string;
  data: ISunoPersona;
}

export interface ISunoPersonasListResponse {
  items: ISunoPersona[];
  count: number;
}

export interface ISunoVoxRequest {
  audio_id: string;
  vocal_start?: number;
  vocal_end?: number;
  callback_url?: string;
}

export interface ISunoVoxResponse {
  success?: boolean;
  task_id: string;
  data: { audio_url?: string };
}

export interface ISunoTimingRequest {
  audio_id: string;
}

export interface ISunoTimingResponse {
  success?: boolean;
  task_id: string;
  data: any;
}

export interface ISunoVoicesRequest {
  audio_url: string;
  name?: string;
  description?: string;
}

export interface ISunoVoicesResponse {
  success?: boolean;
  task_id: string;
  data: any;
}

export interface ISunoMashupLyricsRequest {
  lyrics_a: string;
  lyrics_b: string;
}

export interface ISunoMashupLyricsResponse {
  success?: boolean;
  task_id: string;
  data: { text?: string };
}

export interface ISunoUploadAudio {
  audio_id?: string;
}

export interface ISunoMP4 {
  video_url?: string;
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

export interface ISunoUploadResponse {
  success?: boolean;
  task_id: string;
  data: ISunoUploadAudio;
}

export interface ISunoMp4Response {
  success?: boolean;
  task_id: string;
  data: ISunoMP4;
}

export interface ISunoTask {
  map(arg0: (song: any) => any): any;
  id: string;
  created_at?: number;
  request?: ISunoAudioRequest | ISunoLyricRequest;
  response?: ISunoAudioResponse | ISunoLyricResponse;
}

export type ISunoTaskResponse = ISunoTask;

export interface ISunoTasksResponse {
  count: number;
  items: ISunoTask[];
}
