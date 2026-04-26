import { Module } from 'vuex';
import { IOpenAIImageState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const openaiimage: Module<IOpenAIImageState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default openaiimage;
