import { ActionContext } from 'vuex';
import { IRootState } from './models';
import {
  userOperator,
  ssoOperator,
  siteOperator,
  configOperator,
  exchangeOperator,
  applicationOperator,
  credentialOperator
} from '@/operators';
import { IApplication, IApplicationScope, IApplicationType, ICredential, IToken, IUser, Status } from '@/models';
import { getSiteOrigin } from '@/utils/site';
import { getBaseUrlAuth, getBaseUrlHub, getInviterId, loginRedirect } from '@/utils';
import { isNative } from '@/utils/surface';

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
  try {
    commit('resetUser');
    const { data: user } = await userOperator.getMe();
    commit('setUser', user);
    return user;
  } catch (error) {
    console.error('get user failed', error);
    return undefined;
  }
};

export const getFingerprint = async ({ commit }: ActionContext<IRootState, IRootState>) => {
  // `@fingerprintjs/fingerprintjs` is ~30 KB minified and only needed once,
  // typically well after first paint. Load it lazily so it stays out of the
  // entry chunk and out of the critical-path execution time.
  const { default: FingerprintJS } = await import('@fingerprintjs/fingerprintjs');
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;
  commit('setFingerprint', visitorId);
  return visitorId;
};

export const getToken = async ({ commit }: ActionContext<IRootState, IRootState>, code: string) => {
  try {
    commit('resetToken');
    const { data } = await ssoOperator.token({
      code
    });
    const token = {
      access: data.access_token,
      refresh: data.refresh_token,
      expiration: data.expires_in
    };
    commit('setToken', token);
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
  try {
    const { data } = await exchangeOperator.rate(payload);
    commit('setExchange', {
      [key]: data.rate
    });
    return state.exchange![key];
  } catch (e) {
    console.error('get exchange rate failed');
  }
};

export const initializeSite = async ({ state, commit, dispatch }: ActionContext<IRootState, IRootState>) => {
  const origin = getSiteOrigin(state?.site);
  try {
    const { data } = await siteOperator.initialize({ origin });
    commit('setSite', data);
  } catch (error) {
    console.error('initialize site failed', error);
    dispatch('login');
  }
};

export const getSite = async ({ state, commit }: ActionContext<IRootState, IRootState>) => {
  try {
    const origin = getSiteOrigin(state?.site);
    const site = (
      await siteOperator.getAll({
        origin
      })
    )?.data?.items?.[0];
    commit('setSite', site);
  } catch (error) {
    console.error('get site failed', error);
  }
};

export const fetchConfig = async ({ commit }: ActionContext<IRootState, IRootState>) => {
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
  commit('setApplications', payload);
};

export const getApplications = async ({
  commit,
  state,
  rootState
}: ActionContext<IRootState, IRootState>): Promise<IApplication[] | undefined> => {
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
  if (!application) {
    console.error('Application not found');
    return undefined;
  }
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  commit('setCredential', credential);
  return credential;
};

export const login = async ({ state, commit }: ActionContext<IRootState, IRootState>) => {
  const site = state?.site?.origin;
  if (isNative()) {
    commit('setAuth', {
      flow: 'popup',
      visible: true
    });
  } else {
    commit('setAuth', {
      flow: 'redirect'
    });
    // Preserve the original query string (e.g. ?inviter_id, ?utm_source) so
    // it survives the auth round-trip and is still present when the user
    // lands back on Nexior. inviter_id is also forwarded as a top-level
    // query param by loginRedirect itself.
    loginRedirect({ redirect: window.location.pathname + window.location.search, site });
  }
};

export const logout = async ({ dispatch, commit }: ActionContext<IRootState, IRootState>) => {
  await dispatch('resetAll');
  // Per-app store modules are registered lazily (see `src/store/lazy.ts` and
  // the router's `beforeEach` hook). Only fan out the reset to modules that
  // are actually registered in the running session — there is nothing to
  // reset for a module the user never opened, and dispatching to an
  // unregistered module would emit a Vuex warning.
  const { getRegisteredLazyModules } = await import('@/store/lazy');
  for (const name of getRegisteredLazyModules()) {
    await dispatch(`${name}/resetAll`);
  }
  if (isNative()) {
    // On native platforms, show in-app login popup instead of navigating to
    // external auth URL (which would open Chrome and redirect to localhost)
    commit('setAuth', {
      flow: 'popup',
      visible: true
    });
  } else {
    // Build the post-logout login URL via URLSearchParams so the inviter_id
    // (and any other query params on the current page) survive as top-level
    // query keys after AuthFrontend parses the URL — otherwise they end up
    // nested inside the `redirect` value (because raw `?redirect=${url}`
    // concatenation does no encoding) and AuthFrontend's
    // `URLSearchParams.get('inviter_id')` returns null, breaking referral
    // binding for OAuth signups (especially WeChat) on custom-domain sites.
    const baseUrlAuth = getBaseUrlAuth();
    const baseUrlHub = getBaseUrlHub();
    const site = window.location.origin;
    const inviterId = getInviterId();
    const callbackUrl = `${baseUrlHub}/auth/callback?${new URLSearchParams({
      redirect: window.location.pathname + window.location.search
    }).toString()}`;
    const loginQuery: Record<string, string> = {
      site,
      ...(inviterId ? { inviter_id: inviterId } : {}),
      redirect: callbackUrl
    };
    const loginUrl = `${baseUrlAuth}/auth/login?${new URLSearchParams(loginQuery).toString()}`;
    const redirectUrl = `${baseUrlAuth}/auth/logout?${new URLSearchParams({ redirect: loginUrl }).toString()}`;
    window.location.href = redirectUrl;
  }
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
