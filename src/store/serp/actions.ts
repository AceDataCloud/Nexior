import { applicationOperator, credentialOperator, serpOperator, serviceOperator } from '@/operators';
import { ISerpState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IApplication, ICredential, ISerpConfig, IService } from '@/models';
import { Status } from '@/models/common';
import { SERP_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<ISerpState, IRootState>): void => {
  commit('resetAll');
};

export const setApplication = async ({ commit, dispatch }: any, payload: IApplication): Promise<void> => {
  console.debug('set application', payload);
  commit('setApplication', payload);
  if (!payload) {
    console.debug('application is null, return');
    return;
  }
  const credential = payload?.credentials?.find((credential) => credential?.host === window.location.origin);
  if (credential) {
    console.debug('credential exists, set credential', credential);
    commit('setCredential', credential);
  } else {
    console.debug('credential not exists, start to create credential for application', payload);
    await dispatch('createCredential');
  }
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  console.debug('set applications', payload);
  commit('setApplications', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  console.debug('set service', payload);
  commit('setService', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug('set credential', payload);
  commit('setCredential', payload);
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  console.debug('prepare to create credential for application', application);
  if (!application) {
    console.error('Application not found');
    return undefined;
  }
  console.debug('creating create credential for application', application);
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  console.debug('created credential success', credential);
  commit('setCredential', credential);
  console.debug('end createCredential');
  return credential;
};

export const getService = async ({
  commit,
  state
}: ActionContext<ISerpState, IRootState>): Promise<IService | undefined> => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(SERP_SERVICE_ID);
    state.status.getService = Status.Success;
    commit('setService', service);
    return service;
  } catch (error) {
    state.status.getService = Status.Error;
    commit('setService', undefined);
  }
};

export const getApplications = async ({
  commit,
  state,
  rootState
}: ActionContext<ISerpState, IRootState>): Promise<IApplication[] | undefined> => {
  console.debug('start to get applications for serp');
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: SERP_SERVICE_ID
    });
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    return applications.items;
  } catch (error) {
    console.error('get applications failed', error);
    state.status.getApplications = Status.Error;
    commit('setApplications', undefined);
    commit('setApplication', undefined);
  }
};

export const setConfig = ({ commit }: any, payload: ISerpConfig) => {
  commit('setConfig', payload);
};

export const search = async ({ commit, state }: ActionContext<ISerpState, IRootState>): Promise<void> => {
  const credential = state.credential;
  const token = credential?.token;
  if (!token) {
    console.error('no token specified');
    return;
  }
  const config = state.config;
  if (!config?.query) {
    console.error('no query specified');
    return;
  }
  state.status.search = Status.Request;
  try {
    const { data } = await serpOperator.search(
      {
        query: config.query,
        type: config.type,
        number: config.number,
        page: config.page,
        country: config.country,
        language: config.language,
        range: config.range
      },
      { token }
    );
    state.status.search = Status.Success;
    commit('setResults', data);
  } catch (error) {
    console.error('search failed', error);
    state.status.search = Status.Error;
    commit('setResults', undefined);
  }
};

export default {
  createCredential,
  setService,
  getService,
  resetAll,
  setCredential,
  setConfig,
  setApplications,
  setApplication,
  getApplications,
  search
};
