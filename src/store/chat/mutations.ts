import { IApplication } from '@/operators';
import { IChatState } from './models';
import { Status } from '../common/models';

export const setApplications = (state: IChatState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setApplicationsStatus = (state: IChatState, payload: Status): void => {
  state.applicationsStatus = payload;
};

export default {
  setApplications,
  setApplicationsStatus
};
