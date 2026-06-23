import { IApplication, ICredential, IService, Status } from '@/models';
import { IDigitalHumanConfig, IDigitalHumanTask } from '@/models';

export interface IDigitalHumanState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IDigitalHumanConfig | undefined;
  tasks:
    | {
        items: IDigitalHumanTask[] | undefined;
        total: number | undefined;
        active: IDigitalHumanTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
