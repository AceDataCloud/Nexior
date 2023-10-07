import { createStore, ActionContext } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { removeCookies } from '@/utils/cookie';
import { ENDPOINT } from '@/constants';
import { IApplication, IUser } from '@/operators';
import { ISetting, IState, IToken } from './models';

const store = createStore({
  state(): IState {
    return {
      user: {},
      token: {
        access: import.meta.env.VITE_ACCESS_TOKEN?.toString(),
        refresh: undefined
      },
      setting: {
        endpoint: ENDPOINT,
        stream: false
      },
      applications: []
    };
  },
  mutations: {
    setUser(state: IState, payload: IUser): void {
      state.user = {
        ...state.user,
        ...payload
      };
    },
    setToken(state: IState, payload: IToken): void {
      state.token = {
        ...state.token,
        ...payload
      };
    },
    setSetting(state: IState, payload: ISetting): void {
      state.setting = {
        ...state.setting,
        ...payload
      };
    },
    setApplications(state: IState, payload: IApplication[]): void {
      state.applications = payload;
    }
  },
  actions: {
    resetToken({ commit }) {
      commit('setToken', {});
      removeCookies();
    },
    setUser({ commit }: ActionContext<IState, IState>, payload: IUser) {
      commit('setUser', payload);
    },
    setToken({ commit }: ActionContext<IState, IState>, payload: IToken) {
      commit('setToken', payload);
    },
    setSetting({ commit }: ActionContext<IState, IState>, payload: ISetting) {
      commit('setSetting', payload);
    },
    setApplications({ commit }: ActionContext<IState, IState>, payload: IApplication[]) {
      commit('setApplications', payload);
    }
  },
  getters: {
    authenticated(state): boolean {
      return !!state.token.access;
    },
    user(state): IUser {
      return state.user;
    },
    token(state): IToken {
      return state.token;
    },
    setting(state): ISetting | undefined {
      return state.setting;
    },
    applications(state): IApplication[] | undefined {
      return state.applications;
    }
  },
  plugins: [createPersistedState()]
});

export default store;
