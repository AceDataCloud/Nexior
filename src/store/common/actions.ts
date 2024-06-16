import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { userOperator, oauthOperator, siteOperator } from '@/operators';
import { log } from '@/utils/log';
import { IToken, IUser } from '@/models';
import { v4 as uuid } from 'uuid';

export const resetAll = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetToken');
  commit('resetUser');
  commit('resetSetting');
  commit('resetSite');
};

export const resetUser = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetUser');
};

export const resetSetting = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetSetting');
};

export const resetSite = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetSite');
};

export const resetToken = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetToken');
};

export const setToken = ({ commit }: ActionContext<IRootState, IRootState>, payload: IToken) => {
  commit('setToken', payload);
};

export const setUser = ({ commit }: ActionContext<IRootState, IRootState>, payload: IUser) => {
  commit('setUser', payload);
};

export const getUser = async ({ commit }: ActionContext<IRootState, IRootState>): Promise<IUser> => {
  log(getUser, 'start to get user');
  const { data: user } = await userOperator.getMe();
  commit('setUser', user);
  log(getUser, 'get user success', user);
  return user;
};

export const getToken = async ({ commit }: ActionContext<IRootState, IRootState>, code: string): Promise<IToken> => {
  log(getToken, 'start to get token using code', code);
  const { data } = await oauthOperator.token({
    code
  });
  const token = {
    access: data.access_token,
    refresh: data.refresh_token,
    expiration: data.expires_in
  };
  commit('setToken', token);
  log(getToken, 'get token success', data);
  return token;
};

export const initializeSite = async ({ state, commit }: ActionContext<IRootState, IRootState>) => {
  log(initializeSite, 'start to initialize site');
  const getOrigin = () => {
    if (state.site?.origin) {
      return state.site.origin;
    }
    const host = window.location.host;
    // if localhost, try to get machine name
    if (host.includes('localhost')) {
      // generate uuid
      const randomId = uuid();
      return `http://localhost-${randomId}`;
    } else {
      return window.location.origin;
    }
  };
  const origin = getOrigin();
  const { data } = await siteOperator.initialize({ origin });
  commit('setSite', data);
  log(initializeSite, 'initialize site success', data);
};

export const getSite = async ({ commit }: ActionContext<IRootState, IRootState>, id: string) => {
  log(initializeSite, 'start to get site');
  const { data } = await siteOperator.get(id);
  commit('setSite', data);
  log(initializeSite, 'get site success', data);
};

export default {
  resetToken,
  resetAll,
  resetUser,
  resetSetting,
  resetSite,
  setToken,
  setUser,
  getToken,
  getUser,
  initializeSite,
  getSite
};
