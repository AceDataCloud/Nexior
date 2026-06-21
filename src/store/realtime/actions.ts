import { applicationOperator, credentialOperator, serviceOperator } from '@/operators';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IRealtimeState } from './models';
import { IApplication, ICredential } from '@/models';
import { Status } from '@/models';
import { REALTIME_SERVICE_ID } from '@/constants';
import { getFinalApplication } from '@/utils';

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

// Orchestrate provisioning: service -> applications -> selected app -> credential.
export const init = async ({ dispatch, state, rootState }: any): Promise<ICredential | undefined> => {
  await dispatch('getService');
  // Load this service's individual apps AND the universal (global / 通用余额)
  // balance, then pick the SAME way the wallet does: respect the current
  // selection, else prefer a usable global app over an exhausted individual one.
  // Blind-picking `applications[0]` used to yank the wallet onto a 0-balance
  // individual app and fight the layout's global-preferred selection on mount.
  const [individual] = await Promise.all([
    dispatch('getApplications'),
    dispatch('getApplications', null, { root: true })
  ]);
  const combined = [...(rootState?.applications ?? []), ...((individual as IApplication[]) ?? [])];
  const application = getFinalApplication(combined, state.application);
  if (application) {
    await dispatch('setApplication', application);
  }
  return state.credential;
};

export default {
  getService,
  getApplications,
  createCredential,
  setApplication,
  init
};
