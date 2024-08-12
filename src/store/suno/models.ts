import { IApplication, ICredential, IService, ISunoAudio, Status } from '@/models';
import { ISunoConfig, ISunoTask } from '@/models';

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
  audio: ISunoAudio | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getTasks: Status;
  };
}

// export interface PlayerState {
//   audio?: HTMLAudioElement | undefined;
//   loopType?: number;
//   volume?: number;
//   playList?: Song[] | undefined;
//   showPlayList?: boolean;
//   id?: string;
//   url?: string;
//   song?: Song | undefined;
//   isPlaying?: boolean;
//   isPause?: boolean;
//   sliderInput?: boolean;
//   ended?: boolean;
//   muted?: boolean;
//   currentTime?: number;
//   duration?: number;
// }
