import { IApplication, ICredential, IService, Status } from '@/models';
import { IQrartConfig, IQrartTask } from '@/models';

export interface IQrartState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IQrartConfig | undefined;
  tasks:
    | {
        items: IQrartTask[] | undefined;
        total: number | undefined;
        active: IQrartTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
