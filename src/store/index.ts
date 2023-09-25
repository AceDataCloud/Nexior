import { createStore, ActionContext } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { removeCookies } from '@/utils/cookie';
import { ENDPOINT } from '@/constants';

export interface ISetting {
  stream?: boolean;
  endpoint?: string;
}

export interface IState {
  accessToken: string | undefined;
  setting: ISetting;
}

const store = createStore({
  state(): IState {
    return {
      accessToken: undefined,
      setting: {
        endpoint: ENDPOINT,
        stream: false
      }
    };
  },
  mutations: {
    setAccessToken(state: IState, payload: string): void {
      state.accessToken = payload;
    },
    setSetting(state: IState, payload: ISetting): void {
      state.setting = {
        ...state.setting,
        ...payload
      };
    }
  },
  actions: {
    resetAuth({ commit }) {
      commit('setAccessToken', undefined);
      removeCookies();
    },
    setAccessToken({ commit }: ActionContext<IState, IState>, payload: string) {
      commit('setAccessToken', payload);
    },
    setSetting({ commit }: ActionContext<IState, IState>, payload: ISetting) {
      commit('setSetting', payload);
    }
  },
  getters: {
    authenticated(state): boolean {
      return !!state.accessToken;
    },
    accessToken(state): string | undefined {
      return state.accessToken;
    },
    setting(state): ISetting | undefined {
      return state.setting;
    }
  },
  plugins: [createPersistedState()]
});

export default store;
