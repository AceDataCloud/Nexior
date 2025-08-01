import { IApplication, ICredential, IService, Status } from '@/models';
import { IPixverseConfig, IPixverseTask } from '@/models';

export interface IPixverseState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IPixverseConfig | undefined;
  tasks:
    | {
        items: IPixverseTask[] | undefined;
        total: number | undefined;
        active: IPixverseTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
