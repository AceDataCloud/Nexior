import { IUser } from '@/models';
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

export default {
  setUser,
  setSite,
  setAuth,
  setCurrency,
  setExchange,
  resetUser,
  setToken,
  resetToken,
  resetSite
};
