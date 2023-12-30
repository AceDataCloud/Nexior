import { IUser } from '@/operators';
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

export const resetToken = (state: IRootState): void => {
  state.token = {};
};

export const setSetting = (state: IRootState, payload: any): void => {
  state.setting = {
    ...state.setting,
    ...payload
  };
};

export default {
  setUser,
  setToken,
  resetToken,
  setSetting
};
