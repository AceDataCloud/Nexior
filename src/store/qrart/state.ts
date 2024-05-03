import { IQrartState } from './models';
import { Status } from '@/models';

export default (): IQrartState => {
  return {
    service: undefined,
    application: undefined,
    tasks: undefined,
    credential: undefined,
    config: undefined,
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getTasks: Status.None
    }
  };
};
