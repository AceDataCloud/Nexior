import { IApplication } from '@/operators';
import { Status } from '../common/models';
import { IChatdocRepository } from '@/operators/chatdoc/models';

export interface IChatdocState {
  applications: IApplication[] | undefined;
  getApplicationsStatus: Status | undefined;
  repositories: IChatdocRepository[] | undefined;
  getRepositoriesStatus: Status | undefined;
}
