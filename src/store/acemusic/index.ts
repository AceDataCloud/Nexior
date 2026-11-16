import { Module } from 'vuex';
import { IAcemusicState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const acemusic: Module<IAcemusicState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default acemusic;
