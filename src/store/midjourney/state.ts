import { IMidjourneyState } from './models';
import { Status } from '@/models';

export default (): IMidjourneyState => {
  return {
    service: undefined,
    application: undefined,
    tasks: {
      items: undefined,
      total: undefined
    },
    credential: undefined,
    preset: {},
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getTasks: Status.None
    }
  };
};
