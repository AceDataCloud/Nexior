import { Status } from '@/models';
import { IChatdocState } from './models';

export default (): IChatdocState => {
  return {
    service: undefined,
    application: undefined,
    repositories: undefined,
    credential: undefined,
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getRepositories: Status.None
    }
  };
};
