import { IApplication, ICredential, IService, Status } from '@/models';
import { IQwenImageConfig, IQwenImageTask } from '@/models';

export interface IQwenImageState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IQwenImageConfig | undefined;
  tasks:
    | {
        items: IQwenImageTask[] | undefined;
        total: number | undefined;
        active: IQwenImageTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
