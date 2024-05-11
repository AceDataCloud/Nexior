import { IRootState } from './models';

export const authenticated = (state: IRootState): boolean => {
  return !!state.token.access;
};

export const user = (state: IRootState): any => {
  return state.user;
};

export const token = (state: IRootState): any => {
  return state.token;
};

export const setting = (state: IRootState): any => {
  return state.setting;
};

export default {
  authenticated,
  user,
  token,
  setting
};
