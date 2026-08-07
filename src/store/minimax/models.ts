import { IApplication, ICredential, IService, Status } from '@/models';
import { IMinimaxConfig, IMinimaxVideoTask } from '@/models';

export interface IMinimaxState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IMinimaxConfig | undefined;
  tasks:
    | {
        items: IMinimaxVideoTask[] | undefined;
        total: number | undefined;
        active: IMinimaxVideoTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
