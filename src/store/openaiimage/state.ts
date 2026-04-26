import { IOpenAIImageState } from './models';
import { Status } from '@/models';
import { OPENAIIMAGE_DEFAULT_MODEL, OPENAIIMAGE_DEFAULT_SIZE } from '@/constants';

export default (): IOpenAIImageState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      model: OPENAIIMAGE_DEFAULT_MODEL,
      size: OPENAIIMAGE_DEFAULT_SIZE
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
