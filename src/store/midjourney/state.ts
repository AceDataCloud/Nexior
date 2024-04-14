import { MIDJOURNEY_MODE_FAST } from '@/constants';
import { IMidjourneyState } from './models';
import { Status } from '@/models';

export default (): IMidjourneyState => {
  return {
    service: undefined,
    application: undefined,
    imagineTasks: undefined,
    imagineTasksTotal: undefined,
    credential: undefined,
    preset: {},
    mode: MIDJOURNEY_MODE_FAST,
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getImagineTasks: Status.None
    }
  };
};
