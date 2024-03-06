import { IApplication, IMidjourneyImagineTask, IMidjourneyMode, IMidjourneyPreset, IService, Status } from '@/models';

export interface IMidjourneyState {
  service: IService | undefined;
  application: IApplication | undefined;
  imagineTasks: IMidjourneyImagineTask[] | undefined;
  imagineTasksTotal: number | undefined;
  preset: IMidjourneyPreset;
  mode: IMidjourneyMode;
  status: {
    getService: Status;
    getApplication: Status;
    getImagineTasks: Status;
  };
}
