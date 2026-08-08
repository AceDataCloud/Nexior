import { applicationOperator, credentialOperator, serviceOperator } from '@/operators';
import { buildSerpRequest, serpOperator } from '@/operators/serp';
import type { OperatorRequestOptions } from '@/operators/x402';
import { ISerpState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IApplication, ICredential, ISerpConfig, IService } from '@/models';
import { Status } from '@/models/common';
import { SERP_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<ISerpState, IRootState>): void => {
  commit('resetAll');
};

export const setApplication = async ({ commit, dispatch, rootState }: any, payload: IApplication): Promise<void> => {
  console.debug('set application', payload);
  commit('setApplication', payload);
  if (!payload) {
    console.debug('application is null, return');
    return;
  }
  // Credential-as-Authorization: skip auto-createCredential when the user is
  // a grantee — pick the credential that already belongs to them.
  const me = rootState?.user?.id;
  const isGranted = payload?.role === 'grantee';
  let credential = payload?.credentials?.find((credential) => credential?.host === window.location.origin);
  if (!credential && isGranted) {
    credential = payload?.credentials?.find((credential) => credential?.user_id === me);
  }
  if (credential) {
    console.debug('credential exists, set credential', credential);
    commit('setCredential', credential);
  } else if (!isGranted) {
    console.debug('credential not exists, start to create credential for application', payload);
    await dispatch('createCredential');
  } else {
    console.warn('no credential available for granted application', payload);
    commit('setCredential', undefined);
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
  state
}: ActionContext<ISerpState, IRootState>): Promise<IApplication[] | undefined> => {
  console.debug('start to get applications for serp');
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: 'me',
      service_id: SERP_SERVICE_ID,
      affiliation: ['owner', 'granted']
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

export const search = async (
  { commit, state }: ActionContext<ISerpState, IRootState>,
  options?: OperatorRequestOptions
): Promise<void> => {
  const requestOptions = options || { token: state.credential?.token };
  if (requestOptions.mode !== 'x402' && !requestOptions.token) throw new Error('no token specified');
  const request = buildSerpRequest(state.config);
  if (!request.query) throw new Error('no query specified');
  state.status.search = Status.Request;
  try {
    const { data } = await serpOperator.search(request, requestOptions);
    state.status.search = Status.Success;
    commit('setResults', data);
  } catch (error) {
    console.error('search failed', error);
    state.status.search = Status.Error;
    commit('setResults', undefined);
    throw error;
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
