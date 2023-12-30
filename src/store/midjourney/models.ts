import { IApplication, IMidjourneyPreset } from '@/operators';

export interface IMidjourneyState {
  applications: IApplication[] | undefined;
  preset: IMidjourneyPreset;
}
