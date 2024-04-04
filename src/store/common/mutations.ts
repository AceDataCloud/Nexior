import { IUser } from '@/models';
import { IRootState } from './models';

export const setUser = (state: IRootState, payload: IUser): void => {
  state.user = {
    ...state.user,
    ...payload
  };
};

export const setLocale = (state: IRootState, payload: string): void => {
  state.locale = payload;
};

export const setDark = (state: IRootState, payload: boolean): void => {
  state.dark = payload;
};

export const setToken = (state: IRootState, payload: any): void => {
  state.token = {
    ...state.token,
    ...payload
  };
};

export const resetToken = (state: IRootState): void => {
  state.token = {};
};

export const resetSetting = (state: IRootState): void => {
  state.setting = {};
};

export const resetUser = (state: IRootState): void => {
  state.user = {};
};

export const setSetting = (state: IRootState, payload: any): void => {
  state.setting = {
    ...state.setting,
    ...payload
  };
};

export default {
  setLocale,
  setUser,
  resetUser,
  setToken,
  setDark,
  resetToken,
  setSetting,
  resetSetting
};
