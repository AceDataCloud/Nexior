import { IQrartState } from './models';
import { Status } from '@/models';

export default (): IQrartState => {
  return {
    service: undefined,
    application: undefined,
    tasks: undefined,
    tasksTotal: undefined,
    credential: undefined,
    config: {},
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getTasks: Status.None
    }
  };
};
