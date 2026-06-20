import { IRealtimeState } from './models';
import { Status } from '@/models';

export default (): IRealtimeState => {
  return {
    service: undefined,
    applications: undefined,
    application: undefined,
    credential: undefined,
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getCredential: Status.None
    }
  };
};
