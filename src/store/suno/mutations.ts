import { IApplication, ICredential, ISunoConfig, ISunoTask, IService } from '@/models';
import { ISunoState } from './models';
// import { Song, SongUrl } from '@/models';

// const KEYS = {
//   volume: 'PLAYER-VOLUME'
// };
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

export const setAudio = (state: ISunoState, payload: any): void => {
  state.audio = payload;
};

export const setTasks = (state: ISunoState, payload: any): void => {
  state.tasks = payload;
};
// // 歌曲播放的mutations方法
// // 播放器相关的 mutations
// export const setAudio = (state: RootState, audio: HTMLAudioElement): void => {
//   state.player.audio = audio;
// };
// // 设置循环模式
// export const setLoopType = (state: RootState, loopType: number): void => {
//   state.player.loopType = loopType;
// };
// // 设置音量
// export const setVolume = (state: RootState, volume: number): void => {
//   state.player.volume = volume;
//   state.player.audio.volume = volume / 100;
//   localStorage.setItem(KEYS.volume, volume.toString());
// };
// // 设置播放列表
// export const setPlayList = (state: RootState, playList: Song[]): void => {
//   state.player.playList = playList;
// };
// // 设置是否展示播放列表
// export const setShowPlayList = (state: RootState, showPlayList: boolean): void => {
//   state.player.showPlayList = showPlayList;
// };
// // 设置歌曲ID
// export const setId = (state: RootState, id: string): void => {
//   state.player.id = id;
// };
// // 设置歌曲URL
// export const setUrl = (state: RootState, url: string): void => {
//   state.player.url = url;
// };
// // 设置歌曲
// export const setSong = (state: RootState, song: Song): void => {
//   state.player.song = song;
// };
// // 设置歌曲正在播放
// export const setIsPlaying = (state: RootState, isPlaying: boolean): void => {
//   state.player.isPlaying = isPlaying;
// };
// // 设置歌曲正在暂停
// export const setIsPause = (state: RootState, isPause: boolean): void => {
//   state.player.isPause = isPause;
// };
// // 设置歌曲播放进度
// export const setSliderInput = (state: RootState, sliderInput: boolean): void => {
//   state.player.sliderInput = sliderInput;
// };
// // 设置歌曲播放结束
// export const setEnded = (state: RootState, ended: boolean): void => {
//   state.player.ended = ended;
// };
// // 设置歌曲静音
// export const setMuted = (state: RootState, muted: boolean): void => {
//   state.player.muted = muted;
//   state.player.audio.muted = muted;
// };
// // 设置歌曲播放当前时间
// export const setCurrentTime = (state: RootState, currentTime: number): void => {
//   state.player.currentTime = currentTime;
// };
// // 设置歌曲总时长
// export const setDuration = (state: RootState, duration: number): void => {
//   state.player.duration = duration;
// };
// // 将歌曲添加到播放列表
// export const pushPlayList = (state: RootState, { replace, list }: { replace: boolean; list: Song[] }): void => {
//   if (replace) {
//     state.player.playList = list;
//   } else {
//     list.forEach((song) => {
//       if (state.player.playList.filter((s) => s.id == song.id).length <= 0) {
//         state.player.playList.push(song);
//       }
//     });
//   }
// };
// // 清空播放列表
// export const clearPlayList = (state: RootState): void => {
//   state.player.url = '';
//   state.player.id = '0';
//   state.player.song = {} as Song;
//   state.player.isPlaying = false;
//   state.player.isPause = false;
//   state.player.sliderInput = false;
//   state.player.ended = false;
//   state.player.muted = false;
//   state.player.currentTime = 0;
//   state.player.playList = [];
//   state.player.showPlayList = false;
//   state.player.audio.load();
//   setTimeout(() => {
//     state.player.duration = 0;
//   }, 500);
// };

export default {
  setTasks,
  setApplication,
  setConfig,
  setCredential,
  setService,
  setTasksActive,
  setTasksItems,
  setTasksTotal,
  setAudio,
  resetAll
};
