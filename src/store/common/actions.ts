import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { userOperator, oauthOperator, siteOperator } from '@/operators';
import { log } from '@/utils/log';
import { IToken, IUser } from '@/models';
import { getSiteOrigin } from '@/utils/site';
import { login as authLogin } from '@/utils';

export const resetAll = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetToken');
  commit('resetUser');
  commit('resetSite');
};

export const resetUser = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetUser');
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
  try {
    const { data: user } = await userOperator.getMe();
    commit('setUser', user);
    log(getUser, 'get user success', user);
    return user;
  } catch (error) {
    log(getUser, 'get user failed', error);
  }
};

export const getToken = async ({ commit }: ActionContext<IRootState, IRootState>, code: string): Promise<IToken> => {
  log(getToken, 'start to get token using code', code);
  try {
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
  } catch (error) {
    log(getToken, 'get token failed', error);
  }
};

export const initializeSite = async ({ state, commit, dispatch }: ActionContext<IRootState, IRootState>) => {
  log(initializeSite, 'start to initialize site');
  const origin = getSiteOrigin(state?.site);
  try {
    const { data } = await siteOperator.initialize({ origin });
    commit('setSite', data);
    log(initializeSite, 'initialize site success', data);
  } catch (error) {
    log(initializeSite, 'initialize site failed', error);
    dispatch('login');
  }
};

export const getSite = async ({ state, commit }: ActionContext<IRootState, IRootState>) => {
  log(getSite, 'start to get site');
  try {
    const origin = getSiteOrigin(state?.site);
    const site = (
      await siteOperator.getAll({
        origin
      })
    )?.data?.items?.[0];
    commit('setSite', site);
    log(getSite, 'get site success', site);
  } catch (error) {
    log(getSite, 'get site failed', error);
  }
};

export const login = async ({ state }: ActionContext<IRootState, IRootState>) => {
  const site = state?.site?.origin;
  authLogin({ redirect: window.location.pathname, site });
};

export const logout = async ({ dispatch }: ActionContext<IRootState, IRootState>) => {
  await dispatch('resetAll');
  await dispatch('chat/resetAll');
  await dispatch('midjourney/resetAll');
  await dispatch('chatdoc/resetAll');
  await dispatch('qrart/resetAll');
  await dispatch('login');
};

export default {
  login,
  logout,
  resetToken,
  resetAll,
  resetUser,
  resetSite,
  setToken,
  setUser,
  getToken,
  getUser,
  initializeSite,
  getSite
};
