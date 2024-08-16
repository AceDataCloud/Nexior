import { IMidjourneyState } from './models';
import { Status } from '@/models';

export default (): IMidjourneyState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: {
      items: undefined,
      total: undefined
    },
    credential: undefined,
    preset: {},
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
