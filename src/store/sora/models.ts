import { IApplication, ICredential, IService, Status } from '@/models';
import { ISoraConfig, ISoraTask } from '@/models';

export interface ISoraState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: ISoraConfig | undefined;
  tasks:
    | {
        items: ISoraTask[] | undefined;
        total: number | undefined;
        active: ISoraTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
