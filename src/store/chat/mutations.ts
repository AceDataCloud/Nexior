import { IApplication, IChatConversation, IChatModel, IChatModelGroup, ICredential, IService } from '@/models';
import initialState from './state';
import { IChatState } from './models';

export const resetAll = (state: IChatState): void => {
  const memoryEnabled = state.memoryEnabled;
  // The working directory is a device-level choice, not conversation state —
  // signing out or switching sites must not force the user to pick it again.
  const workingDirectory = state.workingDirectory;
  Object.assign(state, initialState());
  state.memoryEnabled = memoryEnabled;
  state.workingDirectory = workingDirectory;
};

export const setModel = (state: IChatState, payload: IChatModel): void => {
  state.model = payload;
};

export const setModelGroup = (state: IChatState, payload: IChatModelGroup): void => {
  state.modelGroup = payload;
};

export const setCredential = (state: IChatState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IChatState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IChatState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setService = (state: IChatState, payload: IService): void => {
  state.service = payload;
};

export const setConversations = (state: IChatState, payload: IChatConversation[]): void => {
  state.conversations = payload;
};

export const setMemoryEnabled = (state: IChatState, payload: boolean): void => {
  state.memoryEnabled = payload;
};

export const setWorkingDirectory = (state: IChatState, payload: string): void => {
  state.workingDirectory = payload || '';
};

export const setPendingDraft = (state: IChatState, payload: string): void => {
  state.pendingDraft = payload || '';
};

export default {
  setModel,
  setModelGroup,
  setService,
  setCredential,
  setConversations,
  setApplication,
  setApplications,
  setMemoryEnabled,
  setWorkingDirectory,
  setPendingDraft,
  resetAll
};
