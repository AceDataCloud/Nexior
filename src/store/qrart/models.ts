import { IApplication, ICredential, IService, Status } from '@/models';
import { IQrartPreset, IQrartTask } from '@/models';

export interface IQrartState {
  application: IApplication | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  preset: IQrartPreset | undefined;
  tasks: IQrartTask[] | undefined;
  tasksTotal: number | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getTasks: Status;
  };
}
