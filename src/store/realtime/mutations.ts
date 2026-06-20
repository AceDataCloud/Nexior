import { MutationTree } from 'vuex';
import { IRealtimeState } from './models';
import { IApplication, ICredential, IService } from '@/models';

const mutations: MutationTree<IRealtimeState> = {
  setService(state, service: IService | undefined) {
    state.service = service;
  },
  setApplications(state, applications: IApplication[] | undefined) {
    state.applications = applications;
  },
  setApplication(state, application: IApplication | undefined) {
    state.application = application;
  },
  setCredential(state, credential: ICredential | undefined) {
    state.credential = credential;
  }
};

export default mutations;
