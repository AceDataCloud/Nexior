import { IApplication, ICredential, IService, Status } from '@/models';
import { ISeedreamConfig, ISeedreamTask } from '@/models';

export interface ISeedreamState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: ISeedreamConfig | undefined;
  tasks:
    | {
        items: ISeedreamTask[] | undefined;
        total: number | undefined;
        active: ISeedreamTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}

