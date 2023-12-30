import { MIDJOURNEY_CHANNEL_FAST } from '@/operators';
import { IMidjourneyState } from './models';

export default (): IMidjourneyState => {
  return {
    applications: undefined,
    getApplicationsStatus: undefined,
    imagineTasks: undefined,
    getImagineTasksStatus: undefined,
    imagineTasksTotal: undefined,
    preset: {},
    channel: MIDJOURNEY_CHANNEL_FAST
  };
};
