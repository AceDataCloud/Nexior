import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { userOperator, oauthOperator } from '@/operators';
import { log } from '@/utils/log';
import { IToken, IUser } from '@/models';

export const resetAll = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetToken');
  commit('resetUser');
};

export const resetUser = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetUser');
};

export const resetSetting = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetSetting');
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
  const { data: user } = await userOperator.getMe();
  commit('setUser', user);
  log(getUser, 'get user success', user);
  return user;
};

export const getToken = async ({ commit }: ActionContext<IRootState, IRootState>, code: string): Promise<IToken> => {
  log(getToken, 'start to get token using code', code);
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
};

export default {
  resetToken,
  resetAll,
  resetUser,
  resetSetting,
  setToken,
  setUser,
  getToken,
  getUser
};
