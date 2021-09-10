import { createStore, ActionContext } from 'vuex';

interface IUser {
  id: string;
}

interface IState {
  count: number;
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user: IUser | undefined;
}

const store = createStore({
  state(): IState {
    return {
      count: 0,
      accessToken: undefined,
      refreshToken: undefined,
      user: undefined
    };
  },
  mutations: {
    increment(state: IState) {
      state.count++;
    },
    setAccessToken(state: IState, payload: string) {
      state.accessToken = payload;
    },
    setRefreshToken(state: IState, payload: string) {
      state.refreshToken = payload;
    },
    setUser(state: IState, payload: IUser) {
      state.user = {
        ...state.user,
        ...payload
      };
    }
  },
  actions: {
    setRefreshToken({ commit }: ActionContext<IState, IState>, payload: string) {
      commit('setRefreshToken', payload);
    },
    setAccessToken({ commit }: ActionContext<IState, IState>, payload: string) {
      commit('setAccessToken', payload);
    },
    setUser({ commit }: ActionContext<IState, IState>, payload: IUser) {
      commit('setUser', payload);
    }
  }
});

export default store;
