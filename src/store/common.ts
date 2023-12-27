import { ENDPOINT } from '@/constants';
import { IApplication, IUser } from '@/operators';
import { ActionContext, Module } from 'vuex';
import { ICommonState, IRootState, ISetting, IToken } from './models';

export const common: Module<ICommonState, IRootState> = {
  namespaced: true,
  state(): ICommonState {
    return {
      user: {},
      token: {
        access: undefined,
        refresh: undefined
      },
      setting: {
        endpoint: ENDPOINT,
        stream: false
      },
      applications: undefined
    };
  },
  mutations: {
    setUser(state: ICommonState, payload: IUser): void {
      state.user = {
        ...state.user,
        ...payload
      };
    },
    setToken(state: ICommonState, payload: IToken): void {
      state.token = {
        ...state.token,
        ...payload
      };
    },
    resetToken(state: ICommonState): void {
      state.token = {};
    },
    setSetting(state: ICommonState, payload: ISetting): void {
      state.setting = {
        ...state.setting,
        ...payload
      };
    },
    setApplications(state: ICommonState, payload: IApplication[]): void {
      state.applications = payload;
    }
  },
  actions: {
    resetToken({ commit }: ActionContext<ICommonState, IRootState>) {
      commit('resetToken');
    },
    setToken({ commit }: ActionContext<ICommonState, IRootState>, payload: IToken) {
      commit('setToken', payload);
    },
    setUser({ commit }: ActionContext<ICommonState, IRootState>, payload: IUser) {
      commit('setUser', payload);
    },
    setApplications({ commit }: ActionContext<ICommonState, IRootState>, payload: IApplication[]) {
      commit('setApplications', payload);
    }
  },
  getters: {
    authenticated(state: ICommonState): boolean {
      return !!state.token.access;
    },
    user(state: ICommonState): IUser {
      return state.user;
    },
    token(state: ICommonState): IToken {
      return state.token;
    },
    setting(state: ICommonState): ISetting {
      return state.setting;
    },
    applications(state: ICommonState): IApplication[] | undefined {
      return state.applications;
    }
  }
};
