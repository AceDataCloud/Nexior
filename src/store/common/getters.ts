import { IRootState } from './models';

export const authenticated = (state: IRootState): boolean => {
  return !!state.token.access;
};

export const user = (state: IRootState): any => {
  return state.user;
};

export const dark = (state: IRootState): boolean => {
  return state.dark;
};

export const locale = (state: IRootState): string => {
  return state.locale;
};

export const token = (state: IRootState): any => {
  return state.token;
};

export const setting = (state: IRootState): any => {
  return state.setting;
};

export default {
  locale,
  authenticated,
  user,
  token,
  dark,
  setting
};
