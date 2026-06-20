import { IApplication, ICredential, IService, Status } from '@/models';

export interface IRealtimeState {
  service: IService | undefined;
  applications: IApplication[] | undefined;
  application: IApplication | undefined;
  credential: ICredential | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getCredential: Status;
  };
}
