import { IApplication, IMidjourneyImagineTask, IMidjourneyMode, IMidjourneyPreset } from '@/operators';

export interface IMidjourneyState {
  application: IApplication | undefined;
  imagineTasks: IMidjourneyImagineTask[] | undefined;
  imagineTasksTotal: number | undefined;
  preset: IMidjourneyPreset;
  mode: IMidjourneyMode;
}
