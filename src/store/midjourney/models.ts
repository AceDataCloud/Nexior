import { IApplication, IMidjourneyImagineTask, IMidjourneyMode, IMidjourneyPreset } from '@/operators';
import { Status } from '../common/models';

export interface IMidjourneyState {
  application: IApplication | undefined;
  imagineTasks: IMidjourneyImagineTask[] | undefined;
  imagineTasksTotal: number | undefined;
  preset: IMidjourneyPreset;
  mode: IMidjourneyMode;
}
