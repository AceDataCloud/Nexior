import { IApplication, IChatdocRepository, IService, Status } from '@/models';

export interface IChatdocState {
  service: IService | undefined;
  application: IApplication | undefined;
  repositories: IChatdocRepository[] | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getRepositories: Status;
  };
}
