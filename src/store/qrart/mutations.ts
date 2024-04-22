import { IApplication, ICredential, IQrartPreset, IQrartTask, IService } from '@/models';
import { IQrartState } from './models';

export const resetAll = (state: IQrartState): void => {
  state.application = undefined;
  state.preset = {};
  state.tasks = [];
};

export const setService = (state: IQrartState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IQrartState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IQrartState, payload: IApplication): void => {
  state.application = payload;
};

export const setPreset = (state: IQrartState, payload: IQrartPreset): void => {
  state.preset = payload;
};

export const setTasks = (state: IQrartState, payload: IQrartTask[]): void => {
  state.tasks = payload;
};

export const setTasksTotal = (state: IQrartState, payload: number): void => {
  state.tasksTotal = payload;
};

export default {
  setApplication,
  setPreset,
  setCredential,
  setService,
  setTasks,
  setTasksTotal,
  resetAll
};
