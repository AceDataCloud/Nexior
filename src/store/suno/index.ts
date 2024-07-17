import { Module } from 'vuex';
import { RootState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const suno: Module<RootState, any> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters: {
    playListCount: (state) => state.player.playList.length,
    // @ts-ignore
    thisIndex: (state) => state.player.playList.findIndex((song) => song.id === state.player.id),
    nextSong: (state, getters) => {
      const { thisIndex, playListCount } = getters;
      if (thisIndex === playListCount - 1) {
        return state.player.playList[0];
      } else {
        return state.player.playList[thisIndex + 1];
      }
    },
    prevSong: (state, getters) => {
      const { thisIndex } = getters;
      if (thisIndex === 0) {
        return state.player.playList[state.player.playList.length - 1];
      } else {
        return state.player.playList[thisIndex - 1];
      }
    }
  }
};

export default suno;
