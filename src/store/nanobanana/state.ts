import { INanobananaState } from './models';
import { Status } from '@/models';
import { NANOBANANA_DEFAULT_ACTION, NANOBANANA_DEFAULT_ASPECT_RATIO, NANOBANANA_DEFAULT_MODEL } from '@/constants';

export default (): INanobananaState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      action: NANOBANANA_DEFAULT_ACTION,
      aspect_ratio: NANOBANANA_DEFAULT_ASPECT_RATIO,
      model: NANOBANANA_DEFAULT_MODEL
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
