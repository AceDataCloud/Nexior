import { ISeedanceState } from './models';
import { Status } from '@/models';
import {
  SEEDANCE_DEFAULT_EXECUTION_EXPIRES_AFTER,
  SEEDANCE_DEFAULT_MODEL,
  SEEDANCE_DEFAULT_RETURN_LAST_FRAME,
  SEEDANCE_DEFAULT_SERVICE_TIER
} from '@/constants';

export default (): ISeedanceState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      model: SEEDANCE_DEFAULT_MODEL,
      service_tier: SEEDANCE_DEFAULT_SERVICE_TIER as 'default' | 'flex',
      return_last_frame: SEEDANCE_DEFAULT_RETURN_LAST_FRAME,
      execution_expires_after: SEEDANCE_DEFAULT_EXECUTION_EXPIRES_AFTER
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};

