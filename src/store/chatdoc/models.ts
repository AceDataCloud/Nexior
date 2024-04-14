import { IApplication, IChatdocRepository, ICredential, IService, Status } from '@/models';

export interface IChatdocState {
  service: IService | undefined;
  application: IApplication | undefined;
  repositories: IChatdocRepository[] | undefined;
  credential: ICredential | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getRepositories: Status;
  };
}
