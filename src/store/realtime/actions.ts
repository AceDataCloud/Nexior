import { applicationOperator, credentialOperator, serviceOperator } from '@/operators';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IRealtimeState } from './models';
import { IApplication, ICredential } from '@/models';
import { Status } from '@/models';
import { REALTIME_SERVICE_ID } from '@/constants';

export const getService = async ({ commit, state }: ActionContext<IRealtimeState, IRootState>) => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(REALTIME_SERVICE_ID);
    state.status.getService = Status.Success;
    commit('setService', service);
    return service;
  } catch (error) {
    state.status.getService = Status.Error;
    commit('setService', undefined);
  }
};

export const getApplications = async ({ commit, state }: ActionContext<IRealtimeState, IRootState>) => {
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: 'me',
      service_id: REALTIME_SERVICE_ID,
      affiliation: ['owner', 'granted']
    });
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    return applications.items;
  } catch (error) {
    state.status.getApplications = Status.Error;
    commit('setApplications', undefined);
  }
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  if (!application) return undefined;
  state.status.getCredential = Status.Request;
  try {
    const { data: credential } = await credentialOperator.create({
      application_id: application?.id,
      host: window.location.origin
    });
    state.status.getCredential = Status.Success;
    commit('setCredential', credential);
    return credential;
  } catch (error) {
    state.status.getCredential = Status.Error;
    return undefined;
  }
};

export const setApplication = async ({ commit, dispatch, rootState }: any, payload: IApplication): Promise<void> => {
  commit('setApplication', payload);
  if (!payload) return;
  const me = rootState?.user?.id;
  const isGranted = payload?.role === 'grantee';
  let credential = payload?.credentials?.find((c: ICredential) => c?.host === window.location.origin);
  if (!credential && isGranted) {
    credential = payload?.credentials?.find((c: ICredential) => c?.user_id === me);
  }
  if (credential) {
    commit('setCredential', credential);
  } else if (!isGranted) {
    await dispatch('createCredential');
  } else {
    commit('setCredential', undefined);
  }
};

// Orchestrate provisioning: service -> applications -> first usable app -> credential.
export const init = async ({ dispatch, state }: any): Promise<ICredential | undefined> => {
  await dispatch('getService');
  const applications = await dispatch('getApplications');
  const application = (applications || [])[0];
  if (application) {
    await dispatch('setApplication', application);
  }
  return state.credential;
};
