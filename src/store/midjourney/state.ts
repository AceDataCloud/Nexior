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
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getImagineTasks: Status.None
    }
  };
};
