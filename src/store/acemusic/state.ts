import { IAcemusicState } from './models';
import { Status } from '@/models';

export default (): IAcemusicState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    audio: {
      id: '',
      volume: 100
    },
    credential: undefined,
    config: { model: 'acemusic-v1.1', custom: false },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
