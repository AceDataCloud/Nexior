import { IApplication, ICredential, IService, Status } from '@/models';
import { IMaestroConfig, IMaestroTask } from '@/models';

export interface IMaestroState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IMaestroConfig | undefined;
  tasks:
    | {
        items: IMaestroTask[] | undefined;
        total: number | undefined;
        active: IMaestroTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
