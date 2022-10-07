import { createStore, ActionContext } from 'vuex';
import { IUser } from '@/services/user/types';
import createPersistedState from 'vuex-persistedstate';
import UserService from '@/services/user/service';

export interface IState {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user: IUser | undefined;
}

const store = createStore({
  state(): IState {
    return {
      accessToken:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjY1MTc5MTE2LCJqdGkiOiJlYjEzNGMzMjZlMTc0YzViODFhNGZlZDgxMjJlYzFhNiIsInVzZXJfaWQiOjQsInBlcm1pc3Npb25zIjpbInZpZXdfYWNhZGVteV9jb3Vyc2UiXSwiaXNfc3VwZXJ1c2VyIjpmYWxzZSwiaXNfdmVyaWZpZWQiOnRydWUsInJlYWxuYW1lIjoiXHU1ZDE0XHU1ZTg2XHU2MjRkIiwicGhvbmUiOiIxNzYwMDE1NTU2NyIsImlkY2FyZCI6IjM3MDc4MTE5OTQwNjI5MzI3MSJ9.Xc4B9GhgJ5i2I9R_6j7bD38yX3bPC_FI7kUVQzCDaq4',
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
    },
    async getMe({ commit }: ActionContext<IState, IState>) {
      const { data: data } = await UserService.getMe();
      commit('setUser', data);
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
