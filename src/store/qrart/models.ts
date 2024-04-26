import { IApplication, ICredential, IService, Status } from '@/models';
import { IQrartConfig, IQrartTask } from '@/models';

export interface IQrartState {
  application: IApplication | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IQrartConfig | undefined;
  tasks: IQrartTask[] | undefined;
  tasksTotal: number | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getTasks: Status;
  };
}
