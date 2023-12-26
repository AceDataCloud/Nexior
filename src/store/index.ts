import { createStore, ActionContext } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { ENDPOINT } from '@/constants';
import { IApplication, IUser } from '@/operators';
import { ISetting, IState, IToken } from './models';

const store = createStore({
  state(): IState {
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
      applications: [],
      apps: {
        chat: {},
        midjourney: {}
      }
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
    resetToken(state: IState): void {
      state.token = {};
    },
    setSetting(state: IState, payload: ISetting): void {
      state.setting = {
        ...state.setting,
        ...payload
      };
    },
    setApplications(state: IState, payload: IApplication[]): void {
      state.applications = payload;
    },
    setMidjourney(state: IState, payload: any): void {
      state.apps.midjourney = {
        ...state.apps.midjourney,
        ...payload
      };
    },
    setChat(state: IState, payload: any): void {
      state.apps.chat = {
        ...state.apps.chat,
        ...payload
      };
    }
  },
  actions: {
    resetToken({ commit }) {
      commit('resetToken');
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
    },
    setMidjourney({ commit }: ActionContext<IState, IState>, payload: any) {
      commit('setMidjourney', payload);
    },
    setChat({ commit }: ActionContext<IState, IState>, payload: any) {
      commit('setChat', payload);
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
    },
    midjourney(state): any {
      return state.apps.midjourney;
    },
    chat(state): any {
      return state.apps.chat;
    }
  },
  plugins: [createPersistedState()]
});

export default store;
