import { ActionContext } from 'vuex';
import { IRootState, IToken } from '../common/models';
import { IApplication, IUser } from '@/operators';

export const resetToken = ({ commit }: ActionContext<IRootState, IRootState>) => {
  commit('resetToken');
};

export const setToken = ({ commit }: ActionContext<IRootState, IRootState>, payload: IToken) => {
  commit('setToken', payload);
};

export const setUser = ({ commit }: ActionContext<IRootState, IRootState>, payload: IUser) => {
  commit('setUser', payload);
};

export const setApplications = ({ commit }: ActionContext<IRootState, IRootState>, payload: IApplication[]) => {
  commit('setApplications', payload);
};

export default {
  resetToken,
  setToken,
  setUser,
  setApplications
};
