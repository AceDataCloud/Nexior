import { ILumaState } from './models';
import { Status } from '@/models';

export default (): ILumaState => {
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
