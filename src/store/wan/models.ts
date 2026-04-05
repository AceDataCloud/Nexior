import { IApplication, ICredential, IService, Status } from '@/models';
import { IWanConfig, IWanTask } from '@/models';

export interface IWanState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IWanConfig | undefined;
  tasks:
    | {
        items: IWanTask[] | undefined;
        total: number | undefined;
        active: IWanTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
