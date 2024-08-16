import { IQrartState } from './models';
import { Status } from '@/models';

export default (): IQrartState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: undefined,
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
