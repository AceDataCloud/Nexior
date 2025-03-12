import { IApplication, ICredential, IService, Status } from '@/models';
import { IKlingConfig, IKlingTask } from '@/models';

export interface IKlingState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IKlingConfig | undefined;
  tasks:
    | {
        items: IKlingTask[] | undefined;
        total: number | undefined;
        active: IKlingTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
