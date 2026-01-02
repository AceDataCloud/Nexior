import { IApplication, ICredential, ISeedanceConfig, ISeedanceTask, IService, Status } from '@/models';

export interface ISeedanceState {
  service: IService | undefined;
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  tasks:
    | {
        items: ISeedanceTask[] | undefined;
        total: number | undefined;
        active: ISeedanceTask | undefined;
      }
    | undefined;
  credential: ICredential | undefined;
  config: ISeedanceConfig | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}

