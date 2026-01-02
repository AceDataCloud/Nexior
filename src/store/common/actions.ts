import { ActionContext } from 'vuex';
import { IRootState } from './models';
import {
  userOperator,
  oauthOperator,
  siteOperator,
  configOperator,
  exchangeOperator,
  applicationOperator,
  credentialOperator
} from '@/operators';
import { IApplication, IApplicationScope, IApplicationType, ICredential, IToken, IUser, Status } from '@/models';
import { getSiteOrigin } from '@/utils/site';
import { getBaseUrlAuth, loginRedirect } from '@/utils';
import { SURFACE_ANDROID, SURFACE_IOS } from '@/constants';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const resetAll = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetToken');
  commit('resetUser');
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

export const setCurrency = ({ commit }: ActionContext<IRootState, IRootState>, payload: string) => {
  commit('setCurrency', payload);
};

export const setExchange = ({ commit }: ActionContext<IRootState, IRootState>, payload: any) => {
  commit('setExchange', payload);
};

export const setFingerprint = ({ commit }: ActionContext<IRootState, IRootState>, payload: any) => {
  commit('setFingerprint', payload);
};

export const getUser = async ({ commit }: ActionContext<IRootState, IRootState>): Promise<IUser | undefined> => {
  console.debug('start to get user');
  try {
    commit('resetUser');
    const { data: user } = await userOperator.getMe();
    commit('setUser', user);
    console.debug('get user success', user);
    return user;
  } catch (error) {
    console.error('get user failed', error);
    return undefined;
  }
};

export const getFingerprint = async ({ commit }: ActionContext<IRootState, IRootState>) => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;
  console.debug('visitorId', visitorId);
  commit('setFingerprint', visitorId);
  return visitorId;
};

export const getToken = async ({ commit }: ActionContext<IRootState, IRootState>, code: string) => {
  console.debug('start to get token using code', code);
  try {
    commit('resetToken');
    const { data } = await oauthOperator.token({
      code
    });
    console.debug('get token success', data);
    const token = {
      access: data.access_token,
      refresh: data.refresh_token,
      expiration: data.expires_in
    };
    commit('setToken', token);
    console.debug('get token success', data);
    return token;
  } catch (error) {
    console.error('get token failed', error);
  }
};

export const getExchangeRate = async (
  { state, commit }: ActionContext<IRootState, IRootState>,
  payload: { source: string; target: string }
) => {
  if (payload.source === payload.target) {
    return;
  }
  const key = `${payload.source}-${payload.target}`;
  console.debug('start to get exchange rate', key);
  try {
    const { data } = await exchangeOperator.rate(payload);
    console.debug('get exchange rate success', data);
    commit('setExchange', {
      [key]: data.rate
    });
    return state.exchange![key];
  } catch (e) {
    console.error('get exchange rate failed');
  }
};

export const initializeSite = async ({ state, commit, dispatch }: ActionContext<IRootState, IRootState>) => {
  console.debug('start to initialize site');
  const origin = getSiteOrigin(state?.site);
  try {
    const { data } = await siteOperator.initialize({ origin });
    commit('setSite', data);
    console.debug('initialize site success', data);
  } catch (error) {
    console.error('initialize site failed', error);
    dispatch('login');
  }
};

export const getSite = async ({ state, commit }: ActionContext<IRootState, IRootState>) => {
  console.debug('start to get site');
  try {
    const origin = getSiteOrigin(state?.site);
    const site = (
      await siteOperator.getAll({
        origin
      })
    )?.data?.items?.[0];
    commit('setSite', site);
    console.debug('get site success', site);
  } catch (error) {
    console.error('get site failed', error);
  }
};

export const fetchConfig = async ({ commit }: ActionContext<IRootState, IRootState>) => {
  console.debug('start to fetch config');
  try {
    const { data } = await configOperator.get();
    commit('setConfig', data);
    return data;
  } catch (error) {
    console.error('fetch config failed', error);
    commit('setConfig', undefined);
    return undefined;
  }
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  console.debug('set applications', payload);
  commit('setApplications', payload);
};

export const getApplications = async ({
  commit,
  state,
  rootState
}: ActionContext<IRootState, IRootState>): Promise<IApplication[] | undefined> => {
  console.debug('start to get applications for global');
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      limit: 100,
      offset: 0,
      user_id: rootState?.user?.id,
      ordering: '-created_at',
      type: IApplicationType.USAGE,
      scope: IApplicationScope.GLOBAL
    });
    console.debug('global applications from online', applications);
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    return applications.items;
  } catch (error) {
    console.error('get applications failed for global', error);
    state.status.getApplications = Status.Error;
    commit('setApplications', undefined);
  }
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  console.debug('prepare to create credential for application', application);
  if (!application) {
    console.error('Application not found');
    return undefined;
  }
  console.debug('creating create credential for application', application);
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  console.debug('created credential success', credential);
  commit('setCredential', credential);
  console.debug('end createCredential');
  return credential;
};

export const login = async ({ state, commit }: ActionContext<IRootState, IRootState>) => {
  const site = state?.site?.origin;
  if (import.meta.env.VITE_SURFACE === SURFACE_IOS || import.meta.env.VITE_SURFACE === SURFACE_ANDROID) {
    commit('setAuth', {
      flow: 'popup',
      visible: true
    });
    console.debug('login popup');
  } else {
    commit('setAuth', {
      flow: 'redirect'
    });
    console.debug('login redirect');
    loginRedirect({ redirect: window.location.pathname, site });
  }
};

export const logout = async ({ dispatch }: ActionContext<IRootState, IRootState>) => {
  await dispatch('resetAll');
  await dispatch('chat/resetAll');
  await dispatch('midjourney/resetAll');
  await dispatch('flux/resetAll');
  await dispatch('hailuo/resetAll');
  await dispatch('headshots/resetAll');
  await dispatch('kling/resetAll');
  await dispatch('luma/resetAll');
  await dispatch('pika/resetAll');
  await dispatch('pixverse/resetAll');
  await dispatch('qrart/resetAll');
  await dispatch('sora/resetAll');
  await dispatch('suno/resetAll');
  await dispatch('nanobanana/resetAll');
  await dispatch('seedream/resetAll');
  await dispatch('seedance/resetAll');
  await dispatch('veo/resetAll');
  const currentUrl = window.location.href;
  const baseUrlAuth = getBaseUrlAuth();
  const loginUrl = `${baseUrlAuth}/auth/login?redirect=${currentUrl}`;
  const redirectUrl = `${baseUrlAuth}/auth/logout?redirect=${loginUrl}`;
  window.location.href = redirectUrl;
};

export default {
  login,
  logout,
  resetToken,
  resetAll,
  resetUser,
  resetSite,
  setToken,
  setFingerprint,
  setCurrency,
  setUser,
  getFingerprint,
  getExchangeRate,
  getToken,
  getUser,
  initializeSite,
  getSite,
  fetchConfig,
  setExchange,
  setApplications,
  getApplications,
  createCredential
};
