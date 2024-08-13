import { ISunoState } from './models';
import { Status } from '@/models';

export default (): ISunoState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    audio: {
      volume: 100
    },
    credential: undefined,
    config: undefined,
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
