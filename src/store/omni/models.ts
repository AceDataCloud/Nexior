import { IApplication, ICredential, IOmniConfig, IOmniTask, IService, Status } from '@/models';

export interface IOmniState {
  service: IService | undefined;
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  tasks:
    | {
        items: IOmniTask[] | undefined;
        total: number | undefined;
        active: IOmniTask | undefined;
      }
    | undefined;
  credential: ICredential | undefined;
  config: IOmniConfig | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
