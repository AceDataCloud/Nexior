import { Module } from 'vuex';
import { IFluxState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const flux: Module<IFluxState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default flux;
