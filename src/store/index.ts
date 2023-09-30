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
        access:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjk2NjQ2NjMxLCJqdGkiOiI4ODc1NzhhOTgyYjU0ZjBmODQ4NmU2ODFiYTZhYmVkMCIsInVzZXJfaWQiOiJlOGRjYWUyNC0yMmQwLTQ3MTItOTIxNy0zN2MyMzc0MTIwM2EiLCJwZXJtaXNzaW9ucyI6WyJhZGRfbG9nZW50cnkiLCJjaGFuZ2VfbG9nZW50cnkiLCJkZWxldGVfbG9nZW50cnkiLCJ2aWV3X2xvZ2VudHJ5IiwiYWRkX2ludml0YXRpb24iLCJjaGFuZ2VfaW52aXRhdGlvbiIsImRlbGV0ZV9pbnZpdGF0aW9uIiwidmlld19pbnZpdGF0aW9uIiwiYWRkX3Ntc2NvZGUiLCJjaGFuZ2Vfc21zY29kZSIsImRlbGV0ZV9zbXNjb2RlIiwidmlld19zbXNjb2RlIiwiYWRkX3VzZXIiLCJjaGFuZ2VfdXNlciIsImRlbGV0ZV91c2VyIiwidmlld191c2VyIiwiYWRkX3dlY2hhdGluZm8iLCJjaGFuZ2Vfd2VjaGF0aW5mbyIsImRlbGV0ZV93ZWNoYXRpbmZvIiwidmlld193ZWNoYXRpbmZvIiwiYWRkX2dyb3VwIiwiY2hhbmdlX2dyb3VwIiwiZGVsZXRlX2dyb3VwIiwidmlld19ncm91cCIsImFkZF9wZXJtaXNzaW9uIiwiY2hhbmdlX3Blcm1pc3Npb24iLCJkZWxldGVfcGVybWlzc2lvbiIsInZpZXdfcGVybWlzc2lvbiIsImFkZF90b2tlbiIsImNoYW5nZV90b2tlbiIsImRlbGV0ZV90b2tlbiIsInZpZXdfdG9rZW4iLCJhZGRfdG9rZW5wcm94eSIsImNoYW5nZV90b2tlbnByb3h5IiwiZGVsZXRlX3Rva2VucHJveHkiLCJ2aWV3X3Rva2VucHJveHkiLCJhZGRfY29udGVudHR5cGUiLCJjaGFuZ2VfY29udGVudHR5cGUiLCJkZWxldGVfY29udGVudHR5cGUiLCJ2aWV3X2NvbnRlbnR0eXBlIiwiYWRkX3Nlc3Npb24iLCJjaGFuZ2Vfc2Vzc2lvbiIsImRlbGV0ZV9zZXNzaW9uIiwidmlld19zZXNzaW9uIl0sImlzX3N1cGVydXNlciI6dHJ1ZSwiaW52aXRlcl9pZCI6bnVsbCwiaXNfdmVyaWZpZWQiOnRydWUsInJlYWxuYW1lIjoiXHU1ZDE0XHU1ZTg2XHU2MjRkIiwicGhvbmUiOiIxNzYwMDE1NTU2NyIsImlkY2FyZCI6IjM3MDc4MTE5OTQwNjI5MzI3MSJ9.3866OMRcmExhw_7PD4OK_3zU58azknDSUNLvFxFSvbM',
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
