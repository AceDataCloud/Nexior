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
export interface SongUrl {
  id: number;
  url: string;
  br: number;
  size: number;
  md5: string;
  code: number;
  expi: number;
  type: string;
  gain: number;
  fee: number;
  payed: number;
  flag: number;
}

export interface IMusicConfig {
  audio: HTMLAudioElement;
  loopType?: number;
  volume: number;
  playList: Song[];
  showPlayList?: boolean;
  id?: number;
  url?: string;
  song?: Song;
  songUrl?: SongUrl;
  isPlaying?: boolean;
  isPause?: boolean;
  sliderInput?: boolean;
  ended?: boolean;
  muted?: boolean;
  currentTime?: number;
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
