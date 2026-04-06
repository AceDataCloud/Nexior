import { ISerpState } from './models';
import { Status } from '@/models';

export default (): ISerpState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    credential: undefined,
    config: undefined,
    results: undefined,
    status: {
      getService: Status.None,
      getApplications: Status.None,
      search: Status.None
    }
  };
};
