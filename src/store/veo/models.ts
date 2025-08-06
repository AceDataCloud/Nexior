import { IApplication, ICredential, IService, Status } from '@/models';
import { IVeoConfig, IVeoTask } from '@/models';

export interface IVeoState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IVeoConfig | undefined;
  tasks:
    | {
        items: IVeoTask[] | undefined;
        total: number | undefined;
        active: IVeoTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
