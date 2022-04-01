import { createStore, ActionContext } from 'vuex';
import { IUser } from '@/services/user/types';
import createPersistedState from 'vuex-persistedstate';

export interface IState {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user: IUser | undefined;
}

const store = createStore({
  state(): IState {
    return {
      accessToken:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjQ4ODUxMDc2LCJqdGkiOiI0ZGZkMjEzMzNmODY0MTEzYTRjZWZmMzI5NzAyMWFiZiIsInVzZXJfaWQiOjMsInBlcm1pc3Npb25zIjpbInZpZXdfYWNhZGVteV9jb3Vyc2UiXSwiaXNfc3VwZXJ1c2VyIjpmYWxzZX0.ZVEeeU-vZBGSQf4s-RJhnNItZHUmSw0MnsDp4Bgh9RI',
      refreshToken: undefined,
      user: undefined
    };
  },
  mutations: {
    setAccessToken(state: IState, payload: string): void {
      state.accessToken = payload;
    },
    setRefreshToken(state: IState, payload: string): void {
      state.refreshToken = payload;
    },
    setUser(state: IState, payload: IUser): void {
      state.user = {
        ...state.user,
        ...payload
      };
    }
  },
  actions: {
    resetAuth({ commit }) {
      commit('setRefreshToken', undefined);
      commit('setAccessToken', undefined);
      commit('setUser', undefined);
    },
    setRefreshToken({ commit }: ActionContext<IState, IState>, payload: string) {
      commit('setRefreshToken', payload);
    },
    setAccessToken({ commit }: ActionContext<IState, IState>, payload: string) {
      commit('setAccessToken', payload);
    },
    setUser({ commit }: ActionContext<IState, IState>, payload: IUser) {
      commit('setUser', payload);
    }
  },
  getters: {
    authenticated(state): boolean {
      return !!state.accessToken;
    },
    accessToken(state): string | undefined {
      return state.accessToken;
    },
    refreshToken(state): string | undefined {
      return state.refreshToken;
    },
    user(state): IUser | undefined {
      return state.user;
    }
  },
  plugins: [createPersistedState()]
});

export default store;
