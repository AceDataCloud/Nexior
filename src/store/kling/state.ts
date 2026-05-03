import { IKlingState } from './models';
import { Status } from '@/models';

export default (): IKlingState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: undefined,
    motionConfig: undefined,
    taskType: 'videos',
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
