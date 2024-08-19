import { IApplication, ICredential, IService, Status } from '@/models';
import { ILumaConfig, ILumaTask } from '@/models';

export interface ILumaState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: ILumaConfig | undefined;
  tasks:
    | {
        items: ILumaTask[] | undefined;
        total: number | undefined;
        active: ILumaTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
