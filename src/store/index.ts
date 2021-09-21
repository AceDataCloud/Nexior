import { createStore, ActionContext } from 'vuex';
import { IUser } from '@/services/common/user/types';
import createPersistedState from 'vuex-persistedstate';
import { IAlias as IPlatformAlias, PLATFORM_ALIAS_JUEJIN } from '@/settings/platform';

export interface IState {
  count: number;
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user: IUser | undefined;
  cookies: {
    [PLATFORM_ALIAS_JUEJIN]: string;
  };
}

const store = createStore({
  state(): IState {
    return {
      count: 0,
      accessToken: undefined,
      refreshToken: undefined,
      user: undefined,
      cookies: {
        [PLATFORM_ALIAS_JUEJIN]: ''
      }
    };
  },
  mutations: {
    increment(state: IState): void {
      state.count++;
    },
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
    },
    setCookies(
      state: IState,
      payload: {
        alias: IPlatformAlias;
        value: Array<any>;
      }
    ): void {
      console.log('cookies', payload);
      console.log('cookies', JSON.stringify(payload.value));
      state.cookies[payload.alias] = JSON.stringify(payload.value);
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
    setCookies(
      { commit }: ActionContext<IState, IState>,
      payload: {
        alias: IPlatformAlias;
        value: Array<any>;
      }
    ) {
      console.log('setCookies', payload);
      commit('setCookies', payload);
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
    },
    cookies(state) {
      return (alias: string) => {
        return JSON.parse(state.cookies[alias]);
      };
    }
  },
  plugins: [createPersistedState()]
});

export default store;
