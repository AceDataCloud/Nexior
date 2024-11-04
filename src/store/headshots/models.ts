import { IApplication, ICredential, IService, Status } from '@/models';
import { IHeadshotsConfig, IHeadshotsTask } from '@/models';

export interface IHeadshotsState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IHeadshotsConfig | undefined;
  tasks:
    | {
        items: IHeadshotsTask[] | undefined;
        total: number | undefined;
        active: IHeadshotsTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
