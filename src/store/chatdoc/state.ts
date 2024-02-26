import { IChatdocState } from './models';

export default (): IChatdocState => {
  return {
    applications: undefined,
    getApplicationsStatus: undefined,
    repositories: undefined,
    getRepositoriesStatus: undefined
  };
};
