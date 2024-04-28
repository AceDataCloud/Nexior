import { Module } from 'vuex';
import { IQrartState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const qrart: Module<IQrartState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default qrart;
