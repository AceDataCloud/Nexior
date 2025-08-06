import { Module } from 'vuex';
import { IVeoState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const veo: Module<IVeoState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default veo;
