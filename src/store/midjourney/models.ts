import { IApplication, ICredential, IMidjourneyPreset, IMidjourneyTask, IService, Status } from '@/models';

export interface IMidjourneyState {
  service: IService | undefined;
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  tasks:
    | {
        items: IMidjourneyTask[] | undefined;
        total: number | undefined;
      }
    | undefined;
  credential: ICredential | undefined;
  preset: IMidjourneyPreset;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
