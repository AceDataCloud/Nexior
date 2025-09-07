import { IApplication, ICredential, IService, Status } from '@/models';
import { INanobananaConfig, INanobananaTask } from '@/models';

export interface INanobananaState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: INanobananaConfig | undefined;
  tasks:
    | {
        items: INanobananaTask[] | undefined;
        total: number | undefined;
        active: INanobananaTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}

