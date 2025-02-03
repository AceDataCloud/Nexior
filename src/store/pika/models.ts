import { IApplication, ICredential, IService, Status } from '@/models';
import { IPikaConfig, IPikaTask } from '@/models';

export interface IPikaState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IPikaConfig | undefined;
  tasks:
    | {
        items: IPikaTask[] | undefined;
        total: number | undefined;
        active: IPikaTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
