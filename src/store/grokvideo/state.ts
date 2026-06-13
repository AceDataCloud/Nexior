import { IGrokVideoState } from './models';
import { Status } from '@/models';
import {
  GROKVIDEO_DEFAULT_DURATION,
  GROKVIDEO_DEFAULT_MODEL,
  GROKVIDEO_DEFAULT_RATIO,
  GROKVIDEO_DEFAULT_RESOLUTION
} from '@/constants';

export default (): IGrokVideoState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      model: GROKVIDEO_DEFAULT_MODEL,
      aspect_ratio: GROKVIDEO_DEFAULT_RATIO,
      resolution: GROKVIDEO_DEFAULT_RESOLUTION,
      duration: GROKVIDEO_DEFAULT_DURATION
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
