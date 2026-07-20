import type { Module } from 'vuex';
import type { IPoivelleState } from './models';
import actions from './actions';
import * as mutations from './mutations';
import state from './state';

export const poivelle: Module<IPoivelleState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default poivelle;
