import { rememberAccount } from '@/utils/auth/accountSessions';
import { IApplication, IUser } from '@/models';
import { IRootState, ISetting } from './models';

export const setUser = (state: IRootState, payload: IUser): void => {
  state.user = {
    ...state.user,
    ...payload
  };
};

export const rememberCurrentAccount = (state: IRootState): void => {
  state.accounts = rememberAccount(state.accounts || [], state.user, state.token);
};

export const forgetCurrentAccount = (state: IRootState): void => {
  state.accounts = (state.accounts || []).filter(
    (account) => account.user.id !== state.user?.id && account.token.access !== state.token.access
  );
};

export const setToken = (state: IRootState, payload: any): void => {
  state.token = {
    ...state.token,
    ...payload
  };
};

export const setAuth = (state: IRootState, payload: any): void => {
  state.auth = {
    ...state.auth,
    ...payload
  };
};

export const setFingerprint = (state: IRootState, payload: any): void => {
  state.fingerprint = payload;
};

export const resetToken = (state: IRootState): void => {
  state.token = {};
};

export const resetSite = (state: IRootState): void => {
  state.site = {};
};

export const resetUser = (state: IRootState): void => {
  state.user = {};
};

export const setSite = (state: IRootState, payload: any): void => {
  state.site = {
    ...state.site,
    ...payload
  };
};

export const setConfig = (state: IRootState, payload: any): void => {
  state.config = payload;
};

export const setExchange = (state: IRootState, payload: any): void => {
  state.exchange = {
    ...state.exchange,
    ...payload
  };
};

export const setCurrency = (state: IRootState, payload: string): void => {
  state.currency = payload;
};

export const setApplications = (state: IRootState, payload: IApplication[]): void => {
  console.debug('set applications for global', payload);
  state.applications = payload;
};

export const setSetting = (state: IRootState, payload: Partial<ISetting>): void => {
  state.setting = {
    ...state.setting,
    ...payload
  };
};

export default {
  rememberCurrentAccount,
  forgetCurrentAccount,
  setUser,
  setSite,
  setConfig,
  setAuth,
  setCurrency,
  setExchange,
  resetUser,
  setFingerprint,
  setToken,
  resetToken,
  resetSite,
  setApplications,
  setSetting
};
