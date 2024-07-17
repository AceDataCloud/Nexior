import { applicationOperator, sunoOperator, serviceOperator } from '@/operators';
import { RootState } from './models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IRootState } from '../common/models';
import { IApplication, ICredential, ISunoConfig, ISunoTask, IService, Song } from '@/models';
import { Status } from '@/models/common';
import { SUNO_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<RootState, IRootState>): void => {
  commit('resetAll');
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  log(setCredential, 'set credential', payload);
  commit('setCredential', payload);
};

export const setConfig = ({ commit }: any, payload: ISunoConfig) => {
  commit('setConfig', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  log(setService, 'set service', payload);
  commit('setService', payload);
};

export const setApplication = ({ commit }: any, payload: IApplication[]) => {
  commit('setApplication', payload);
};

export const getApplication = async ({
  commit,
  state,
  rootState
}: ActionContext<RootState, IRootState>): Promise<IApplication> => {
  log(getApplication, 'start to get application for suno');
  return new Promise(async (resolve, reject) => {
    state.status.getApplication = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: SUNO_SERVICE_ID
      })
      .then((response) => {
        state.status.getApplication = Status.Success;
        commit('setApplication', response.data.items[0]);
        const credential = response.data.items?.[0]?.credentials?.find(
          (credential) => credential?.host === window.location.origin
        );
        commit('setCredential', credential);
        resolve(response.data.items[0]);
      })
      .catch((error) => {
        state.status.getApplication = Status.Error;
        reject(error);
      });
  });
};

export const setTasks = ({ commit }: any, payload: any) => {
  commit('setTasks', payload);
};

export const setTasksItems = ({ commit }: any, payload: ISunoTask[]) => {
  commit('setTasksItems', payload);
};

export const setTasksTotal = ({ commit }: any, payload: number) => {
  commit('setTasksTotal', payload);
};

export const setTasksActive = ({ commit }: any, payload: ISunoTask) => {
  commit('setTasksActive', payload);
};

export const getService = async ({ commit, state }: ActionContext<RootState, IRootState>): Promise<IService> => {
  return new Promise(async (resolve, reject) => {
    log(getService, 'start to get service for suno');
    state.status.getService = Status.Request;
    serviceOperator
      .get(SUNO_SERVICE_ID)
      .then((response) => {
        state.status.getService = Status.Success;
        commit('setService', response.data);
        resolve(response.data);
      })
      .catch((error) => {
        state.status.getService = Status.Error;
        reject(error);
      });
  });
};

export const getTasks = async (
  { commit, state }: ActionContext<RootState, IRootState>,
  { offset, limit }: { offset?: number; limit?: number }
): Promise<ISunoTask[]> => {
  return new Promise(async (resolve, reject) => {
    log(getTasks, 'start to get tasks', offset, limit);
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    sunoOperator
      .tasks(
        {
          applicationId: state.application?.id
        },
        {
          token
        }
      )
      .then((response) => {
        log(getTasks, 'get imagine tasks success', response.data.items);
        commit('setTasksItems', response.data.items);
        commit('setTasksTotal', response.data.count);
        resolve(response.data.items);
      })
      .catch((error) => {
        return reject(error);
      });
  });
};

// 歌曲播放action部分
// 播放器相关的 actions
export const initPlayer = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  commit('setVolume', state.player.volume);
};
// 将歌曲放入播放列表
export const pushPlayList = (
  { commit }: ActionContext<RootState, IRootState>,
  { replace, list }: { replace: boolean; list: Song[] }
): void => {
  commit('pushPlayList', { replace, list });
};
// 清空播放列表
export const clearPlayList = ({ commit }: ActionContext<RootState, IRootState>): void => {
  commit('clearPlayList');
};
// 播放歌曲
export const play = ({ commit, state, dispatch }: ActionContext<RootState, IRootState>, song: Song): void => {
  if (song.id == state.player.id) return;
  commit('setIsPlaying', false);
  // const data = await useSongUrl(id);
  // @ts-ignore
  state.player.audio.src = song.audio_url;
  state.player.audio
    .play()
    .then(() => {
      commit('setIsPlaying', true);
      commit('setUrl', song.audio_url);
      commit('setId', song.id);
      dispatch('songDetail', song);
    })
    .catch((res) => {
      console.log(res);
    });
};
// 播放结束
export const playEnd = ({ state, dispatch }: ActionContext<RootState, IRootState>): void => {
  console.log('播放结束');
  switch (state.player.loopType) {
    case 0:
      dispatch('rePlay');
      break;
    case 1:
      dispatch('next');
      break;
    case 2:
      dispatch('randomPlay');
      break;
  }
};

export const songDetail = ({ commit, state }: ActionContext<RootState, IRootState>, song: Song): void => {
  commit('setSong', song);
  commit('pushPlayList', { replace: false, list: [song] });
};
// 重复播放歌曲
export const rePlay = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  setTimeout(() => {
    commit('setCurrentTime', 0);
    state.player.audio.play();
  }, 1500);
};
// 下一首
export const next = ({ state, dispatch, getters }: ActionContext<RootState, IRootState>): void => {
  if (state.player.loopType === 2) {
    dispatch('randomPlay');
  } else {
    dispatch('play', getters.nextSong);
  }
};
// 上一首
export const prev = ({ dispatch, getters }: ActionContext<RootState, IRootState>): void => {
  dispatch('play', getters.prevSong);
};
// 随机播放
export const randomPlay = ({ state, dispatch }: ActionContext<RootState, IRootState>): void => {
  const randomSong = state.player.playList[Math.floor(Math.random() * state.player.playList.length)];
  dispatch('play', randomSong);
};

export const togglePlay = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  if (!state.player.song.id) return;
  const isPlaying = !state.player.isPlaying;
  commit('setIsPlaying', isPlaying);
  if (!isPlaying) {
    state.player.audio.pause();
    commit('setIsPause', true);
  } else {
    state.player.audio.play();
    commit('setIsPause', false);
  }
};

export const setPlay = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  if (!state.player.song.id) return;
  commit('setIsPlaying', true);
  state.player.audio.play();
  commit('setIsPause', false);
};

export const setPause = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  if (!state.player.song.id) return;
  commit('setIsPlaying', false);
  state.player.audio.pause();
  commit('setIsPause', true);
};

export const toggleLoop = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  const newLoopType = state.player.loopType === 2 ? 0 : state.player.loopType + 1;
  commit('setLoopType', newLoopType);
};

export const toggleMuted = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  commit('setMuted', !state.player.muted);
};

export const setVolume = ({ commit }: ActionContext<RootState, IRootState>, volume: number): void => {
  volume = Math.min(100, Math.max(0, volume));
  commit('setVolume', volume);
};

export const onSliderChange = ({ commit, state }: ActionContext<RootState, IRootState>, val: number): void => {
  commit('setCurrentTime', val);
  commit('setSliderInput', false);
  state.player.audio.currentTime = val;
};

export const onSliderInput = ({ commit }: ActionContext<RootState, IRootState>, val: number): void => {
  commit('setSliderInput', true);
};

export const interval = ({ commit, state }: ActionContext<RootState, IRootState>): void => {
  if (state.player.isPlaying && !state.player.sliderInput) {
    commit('setCurrentTime', Math.floor(state.player.audio.currentTime));
    commit('setDuration', Math.floor(state.player.audio.duration));
    commit('setEnded', state.player.audio.ended);
  }
};

export default {
  setService,
  getService,
  resetAll,
  setCredential,
  setConfig,
  setApplication,
  getApplication,
  setTasks,
  setTasksItems,
  setTasksTotal,
  setTasksActive,
  getTasks,
  // 播放器相关的 actions
  initPlayer,
  pushPlayList,
  clearPlayList,
  play,
  playEnd,
  songDetail,
  rePlay,
  next,
  prev,
  randomPlay,
  togglePlay,
  setPlay,
  setPause,
  toggleLoop,
  toggleMuted,
  setVolume,
  onSliderChange,
  onSliderInput,
  interval
};
