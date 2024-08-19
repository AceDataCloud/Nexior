import { IApplication, IChatdocRepository, ICredential, IService, Status } from '@/models';

export interface IChatdocState {
  service: IService | undefined;
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  repositories: IChatdocRepository[] | undefined;
  credential: ICredential | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getRepositories: Status;
  };
}
