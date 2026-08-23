import { IQwenImageState } from './models';
import { Status } from '@/models';
import { QWEN_IMAGE_DEFAULT_MODEL, QWEN_IMAGE_DEFAULT_SIZE } from '@/constants';

export default (): IQwenImageState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    tasks: undefined,
    credential: undefined,
    config: {
      model: QWEN_IMAGE_DEFAULT_MODEL,
      size: QWEN_IMAGE_DEFAULT_SIZE,
      n: 1,
      prompt_extend: true,
      enable_thinking: true,
      watermark: false
    },
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getTasks: Status.None
    }
  };
};
