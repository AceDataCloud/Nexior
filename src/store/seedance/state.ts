import { ISeedanceState } from './models';
import { Status } from '@/models';
import {
  SEEDANCE_DEFAULT_CAMERA_FIXED,
  SEEDANCE_DEFAULT_DURATION,
  SEEDANCE_DEFAULT_EXECUTION_EXPIRES_AFTER,
  SEEDANCE_DEFAULT_GENERATE_AUDIO,
  SEEDANCE_DEFAULT_MODEL,
  SEEDANCE_DEFAULT_RATIO,
  SEEDANCE_DEFAULT_RESOLUTION,
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
      duration: SEEDANCE_DEFAULT_DURATION,
      resolution: SEEDANCE_DEFAULT_RESOLUTION,
      ratio: SEEDANCE_DEFAULT_RATIO,
      camerafixed: SEEDANCE_DEFAULT_CAMERA_FIXED,
      generate_audio: SEEDANCE_DEFAULT_GENERATE_AUDIO,
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
