import { createStore, ActionContext } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { userOperator, IUser } from '@/operators';
import { removeCookies } from '@/utils/cookie';
import { IConversation } from '@/operators/conversation/models';

export interface IState {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user: IUser | undefined;
  conversations: IConversation[];
}

const store = createStore({
  state(): IState {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      user: undefined,
      conversations: []
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
      state.user = payload;
    },
    setConversations(state: IState, payload: IConversation[]): void {
      state.conversations = payload;
    }
  },
  actions: {
    resetAuth({ commit }) {
      commit('setRefreshToken', undefined);
      commit('setAccessToken', undefined);
      commit('setUser', undefined);
      removeCookies();
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
    setConversations({ commit }: ActionContext<IState, IState>, payload: IConversation[]) {
      commit('setConversations', payload);
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
    },
    conversations(state): IConversation[] {
      return state.conversations || [];
    }
  },
  plugins: [createPersistedState()]
});

export default store;
