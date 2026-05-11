import { IApplication, ICredential, IService, IWebextratorConfig, IWebextratorResponse } from '@/models';
import initialState from './state';
import { IWebextratorState } from './models';

export const resetAll = (state: IWebextratorState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IWebextratorState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IWebextratorState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IWebextratorState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IWebextratorState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IWebextratorState, payload: IWebextratorConfig): void => {
  state.config = payload;
};

export const setResponse = (state: IWebextratorState, payload: IWebextratorResponse | undefined): void => {
  state.response = payload;
};

export default {
  setApplication,
  setApplications,
  setConfig,
  setCredential,
  setService,
  setResponse,
  resetAll
};
