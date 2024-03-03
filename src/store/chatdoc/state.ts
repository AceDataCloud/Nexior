import { Status } from '@/models';
import { IChatdocState } from './models';

export default (): IChatdocState => {
  return {
    service: undefined,
    application: undefined,
    repositories: undefined,
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getRepositories: Status.None
    }
  };
};
