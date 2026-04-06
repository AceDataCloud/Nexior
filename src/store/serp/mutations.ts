import { IApplication, ICredential, ISerpConfig, ISerpSearchResponse, IService } from '@/models';
import initialState from './state';
import { ISerpState } from './models';

export const resetAll = (state: ISerpState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: ISerpState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ISerpState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ISerpState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: ISerpState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: ISerpState, payload: ISerpConfig): void => {
  state.config = payload;
};

export const setResults = (state: ISerpState, payload: ISerpSearchResponse | undefined): void => {
  state.results = payload;
};

export default {
  setApplication,
  setApplications,
  setConfig,
  setCredential,
  setService,
  setResults,
  resetAll
};
