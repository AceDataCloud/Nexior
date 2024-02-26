import { MIDJOURNEY_MODE_FAST } from '@/operators';
import { IMidjourneyState } from './models';

export default (): IMidjourneyState => {
  return {
    application: undefined,
    imagineTasks: undefined,
    imagineTasksTotal: undefined,
    preset: {},
    mode: MIDJOURNEY_MODE_FAST
  };
};
