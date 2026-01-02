import { ISeedreamState } from './models';
import { Status } from '@/models';
import { SEEDREAM_DEFAULT_MODEL, SEEDREAM_DEFAULT_SIZE, SEEDREAM_DEFAULT_WATERMARK } from '@/constants';

export default (): ISeedreamState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      model: SEEDREAM_DEFAULT_MODEL,
      size: SEEDREAM_DEFAULT_SIZE,
      watermark: SEEDREAM_DEFAULT_WATERMARK
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};

