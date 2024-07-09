import { IApplication, ICredential, IService, Status } from '@/models';
import { ISunoConfig, ISunoTask } from '@/models';

export interface ISunoState {
  application: IApplication | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: ISunoConfig | undefined;
  tasks:
    | {
        items: ISunoTask[] | undefined;
        total: number | undefined;
        active: ISunoTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getTasks: Status;
  };
}
