import { IApplication, ICredential, IAcemusicConfig, IAcemusicTask, IService } from '@/models';
import { IAcemusicState } from './models';

export const resetAll = (state: IAcemusicState): void => {
  state.lyricsTask = undefined;
  state.service = undefined;
  state.application = undefined;
  state.applications = undefined;
  state.config = { model: 'acemusic-v1.1', custom: false };
  state.credential = undefined;
  state.tasks = undefined;
  state.audio?.object?.pause();
  state.audio = { id: '', volume: 100 };
};

export const setApplications = (state: IAcemusicState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setService = (state: IAcemusicState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IAcemusicState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IAcemusicState, payload: IApplication): void => {
  state.application = payload;
};

export const setConfig = (state: IAcemusicState, payload: IAcemusicConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IAcemusicState, payload: IAcemusicTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IAcemusicState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IAcemusicState, payload: IAcemusicTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setAudio = (state: IAcemusicState, payload: any): void => {
  state.audio = payload;
};

export const setTasks = (state: IAcemusicState, payload: any): void => {
  state.tasks = payload;
};

export default {
  setLyricsTask: (state: IAcemusicState, payload: IAcemusicState['lyricsTask']) => {
    state.lyricsTask = payload;
  },
  setTasks,
  setApplication,
  setApplications,
  setConfig,
  setCredential,
  setService,
  setTasksActive,
  setTasksItems,
  setTasksTotal,
  setAudio,
  resetAll
};
