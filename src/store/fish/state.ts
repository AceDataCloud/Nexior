import { IFishState } from './models';
import { Status } from '@/models';

export default (): IFishState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: undefined,
    voices: undefined,
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
