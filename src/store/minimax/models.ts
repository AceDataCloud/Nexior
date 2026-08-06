import { IApplication, ICredential, IService, Status } from '@/models';
import { IMinimaxConfig, IMinimaxTask } from '@/models';

export interface IMinimaxState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IMinimaxConfig | undefined;
  tasks:
    | {
        items: IMinimaxTask[] | undefined;
        total: number | undefined;
        active: IMinimaxTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
