import { IApplication, ICredential, IGrokVideoConfig, IGrokVideoTask, IService, Status } from '@/models';

export interface IGrokVideoState {
  service: IService | undefined;
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  tasks:
    | {
        items: IGrokVideoTask[] | undefined;
        total: number | undefined;
        active: IGrokVideoTask | undefined;
      }
    | undefined;
  credential: ICredential | undefined;
  config: IGrokVideoConfig | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
