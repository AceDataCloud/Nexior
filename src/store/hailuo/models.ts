import { IApplication, ICredential, IService, Status } from '@/models';
import { IHailuoConfig, IHailuoTask } from '@/models';

export interface IHailuoState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IHailuoConfig | undefined;
  tasks:
    | {
        items: IHailuoTask[] | undefined;
        total: number | undefined;
        active: IHailuoTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
