import { IApplication, IMidjourneyImagineTask, IMidjourneyMode, IMidjourneyPreset } from '@/models';

export interface IMidjourneyState {
  application: IApplication | undefined;
  imagineTasks: IMidjourneyImagineTask[] | undefined;
  imagineTasksTotal: number | undefined;
  preset: IMidjourneyPreset;
  mode: IMidjourneyMode;
}
