import { INanobananaState } from './models';
import { Status } from '@/models';
import { NANOBANANA_DEFAULT_MODEL, NANOBANANA_DEFAULT_RESOLUTION } from '@/constants';

export default (): INanobananaState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      model: NANOBANANA_DEFAULT_MODEL,
      resolution: NANOBANANA_DEFAULT_RESOLUTION
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
