import { Module } from 'vuex';
import { IFishState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const fish: Module<IFishState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default fish;
