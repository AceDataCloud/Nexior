import { applicationOperator, credentialOperator, serviceOperator, webextratorOperator } from '@/operators';
import { ActionContext } from 'vuex';
import { IApplication, ICredential, IService, IWebextratorConfig, Status } from '@/models';
import { IRootState } from '../common/models';
import { IWebextratorState } from './models';
import { WEBEXTRATOR_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IWebextratorState, IRootState>): void => {
  commit('resetAll');
};

export const setApplication = async ({ commit, dispatch }: any, payload: IApplication): Promise<void> => {
  console.debug('webextrator: set application', payload);
  commit('setApplication', payload);
  if (!payload) {
    return;
  }
  const credential = payload?.credentials?.find((credential) => credential?.host === window.location.origin);
  if (credential) {
    commit('setCredential', credential);
  } else {
    await dispatch('createCredential');
  }
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  commit('setApplications', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  commit('setService', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  commit('setCredential', payload);
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  if (!application) {
    console.error('webextrator: application not found');
    return undefined;
  }
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  commit('setCredential', credential);
  return credential;
};

export const getService = async ({
  commit,
  state
}: ActionContext<IWebextratorState, IRootState>): Promise<IService | undefined> => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(WEBEXTRATOR_SERVICE_ID);
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
}: ActionContext<IWebextratorState, IRootState>): Promise<IApplication[] | undefined> => {
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: WEBEXTRATOR_SERVICE_ID
    });
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    return applications.items;
  } catch (error) {
    console.error('webextrator: get applications failed', error);
    state.status.getApplications = Status.Error;
    commit('setApplications', undefined);
    commit('setApplication', undefined);
  }
};

export const setConfig = ({ commit }: any, payload: IWebextratorConfig) => {
  commit('setConfig', payload);
};

export const run = async ({ commit, state }: ActionContext<IWebextratorState, IRootState>): Promise<void> => {
  const credential = state.credential;
  const token = credential?.token;
  if (!token) {
    console.error('webextrator: no token specified');
    return;
  }
  const config = state.config;
  if (!config?.url) {
    console.error('webextrator: no url specified');
    return;
  }
  state.status.run = Status.Request;
  // Trim empty optional fields before sending.
  const base = {
    url: config.url,
    wait_until: config.wait_until,
    timeout: config.timeout,
    delay: config.delay,
    wait_for_selector: config.wait_for_selector || undefined,
    block_resources: config.block_resources?.length ? config.block_resources : undefined,
    user_agent: config.user_agent || undefined
  };
  try {
    const { data } =
      config.mode === 'render'
        ? await webextratorOperator.render(base, { token })
        : await webextratorOperator.extract(
            {
              ...base,
              expected_type: config.expected_type,
              enable_llm: !!config.enable_llm
            },
            { token }
          );
    state.status.run = Status.Success;
    commit('setResponse', data);
  } catch (error: any) {
    state.status.run = Status.Error;
    // Try to surface the structured error body so the page can react to it
    // (e.g. ERROR_CODE_USED_UP) without re-throwing.
    const responseBody = error?.response?.data;
    if (responseBody && typeof responseBody === 'object') {
      commit('setResponse', responseBody);
    } else {
      commit('setResponse', undefined);
    }
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
  run
};
