import { IApplication, ICredential, IService, Status } from '@/models';
import { IFluxConfig, IFluxTask } from '@/models';

export interface IFluxState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IFluxConfig | undefined;
  tasks:
    | {
        items: IFluxTask[] | undefined;
        total: number | undefined;
        active: IFluxTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
