import { IApplication, ICredential, IUser } from '@/models';
import { IRootState } from './models';

export const setUser = (state: IRootState, payload: IUser): void => {
  state.user = {
    ...state.user,
    ...payload
  };
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

export const setExchange = (state: IRootState, payload: any): void => {
  state.exchange = {
    ...state.exchange,
    ...payload
  };
};

export const setCurrency = (state: IRootState, payload: string): void => {
  state.currency = payload;
};

export const setCredential = (state: IRootState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IRootState, payload: IApplication): void => {
  console.debug('set application for global', payload);
  state.application = payload;
};

export const setApplications = (state: IRootState, payload: IApplication[]): void => {
  console.debug('set applications for global', payload);
  state.applications = payload;
};

export default {
  setUser,
  setSite,
  setAuth,
  setCurrency,
  setExchange,
  resetUser,
  setFingerprint,
  setToken,
  resetToken,
  resetSite,
  setCredential,
  setApplication,
  setApplications
};
