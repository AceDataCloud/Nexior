import { IApplication, ICredential, ISunoConfig, ISunoTask, IService } from '@/models';
import { ISunoState } from './models';
import { Song, SongUrl } from '@/models';

export const resetAll = (state: ISunoState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: ISunoState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ISunoState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ISunoState, payload: IApplication): void => {
  state.application = payload;
};

export const setConfig = (state: ISunoState, payload: ISunoConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: ISunoState, payload: ISunoTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: ISunoState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: ISunoState, payload: ISunoTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: ISunoState, payload: any): void => {
  state.tasks = payload;
};
// 歌曲播放的mutations方法

export const init = (state: ISunoState): void => {
  state.music.audio.volume = state.music.volume / 100;
};

export const pushPlayList = (state: ISunoState, replace: boolean, ...list: Song[]): void => {
  if (replace) {
    state.music.playList = list;
    return;
  }
  list.forEach((song) => {
    if (state.music.playList.filter((s) => s.id == song.id).length <= 0) {
      state.music.playList.push(song);
    }
  });
};

export const clearPlayList = (state: ISunoState): void => {
  state.music.songUrl = {} as SongUrl;
  state.music.url = '';
  state.music.id = 0;
  state.music.song = {} as Song;
  state.music.isPlaying = false;
  state.music.isPause = false;
  state.music.sliderInput = false;
  state.music.ended = false;
  state.music.muted = false;
  state.music.currentTime = 0;
  state.music.playList = [] as Song[];
  state.music.showPlayList = false;
  state.music.audio.load();
  setTimeout(() => {
    state.music.duration = 0;
  }, 500);
};

export const play = (state: ISunoState, id: number): void => {
  state.music.songUrl = {} as SongUrl;
  state.music.url = '';
  state.music.id = 0;
  state.music.song = {} as Song;
  state.music.isPlaying = false;
  state.music.isPause = false;
  state.music.sliderInput = false;
  state.music.ended = false;
  state.music.muted = false;
  state.music.currentTime = 0;
  state.music.playList = [] as Song[];
  state.music.showPlayList = false;
  state.music.audio.load();
  setTimeout(() => {
    state.music.duration = 0;
  }, 500);
};

export default {
  setTasks,
  setApplication,
  setConfig,
  setCredential,
  setService,
  setTasksActive,
  setTasksItems,
  setTasksTotal,
  resetAll
};
