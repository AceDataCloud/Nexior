import { IApplication, ICredential, IService, Status } from '@/models';
import { ISunoConfig, ISunoTask, Song, SongUrl } from '@/models';

export interface ISunoState {
  application: IApplication | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: ISunoConfig | undefined;
  tasks:
    | {
        items: ISunoTask[] | undefined;
        total: number | undefined;
        active: ISunoTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getTasks: Status;
  };
}

export interface PlayerState {
  audio: HTMLAudioElement;
  loopType: number;
  volume: number;
  playList: Song[];
  showPlayList: boolean;
  id: string;
  url: string;
  // songUrl: SongUrl;
  song: Song;
  isPlaying: boolean;
  isPause: boolean;
  sliderInput: boolean;
  ended: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;
}

export interface RootState extends ISunoState {
  player: PlayerState;
}
