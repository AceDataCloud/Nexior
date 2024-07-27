import { ISunoState } from './models';
import { Status, Song } from '@/models';

export default (): ISunoState => {
  return {
    service: undefined,
    application: undefined,
    tasks: undefined,
    audio: {
      volume: 100
    },
    credential: undefined,
    config: undefined,
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getTasks: Status.None
    }
  };
};
