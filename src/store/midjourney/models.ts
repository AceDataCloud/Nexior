import { IApplication, ICredential, IMidjourneyImagineTask, IMidjourneyPreset, IService, Status } from '@/models';

export interface IMidjourneyState {
  service: IService | undefined;
  application: IApplication | undefined;
  imagineTasks: IMidjourneyImagineTask[] | undefined;
  imagineTasksTotal: number | undefined;
  credential: ICredential | undefined;
  preset: IMidjourneyPreset;
  status: {
    getService: Status;
    getApplication: Status;
    getImagineTasks: Status;
  };
}
