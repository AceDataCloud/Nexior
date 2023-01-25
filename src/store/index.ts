import { createStore, ActionContext } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { userOperator, IUser } from '@/operators';

export interface IState {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user: IUser | undefined;
}

const store = createStore({
  state(): IState {
    return {
      accessToken: undefined,
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
    getMe({ commit }: ActionContext<IState, IState>) {
      userOperator
        .getMe()
        .then(({ data: data }) => {
          commit('setUser', data);
        })
        .catch(() => {
          console.error('failed to get user info');
        });
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
