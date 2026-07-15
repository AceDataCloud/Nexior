import { IOmniState } from './models';
import { Status } from '@/models';
import { OMNI_DEFAULT_MODEL, OMNI_DEFAULT_RATIO, OMNI_DEFAULT_RESOLUTION } from '@/constants';

export default (): IOmniState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      model: OMNI_DEFAULT_MODEL,
      aspect_ratio: OMNI_DEFAULT_RATIO,
      resolution: OMNI_DEFAULT_RESOLUTION
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
