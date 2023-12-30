import { IApplication, IMidjourneyChannel, IMidjourneyImagineTask, IMidjourneyPreset } from '@/operators';
import { Status } from '../common/models';

export interface IMidjourneyState {
  applications: IApplication[] | undefined;
  getApplicationsStatus: Status | undefined;
  imagineTasks: IMidjourneyImagineTask[] | undefined;
  getImagineTasksStatus: Status | undefined;
  imagineTasksTotal: number | undefined;
  preset: IMidjourneyPreset;
  channel: IMidjourneyChannel;
}
