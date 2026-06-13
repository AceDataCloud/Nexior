import { grokvideoOperator } from '@/operators';
import { IGrokVideoConfig, IGrokVideoTask } from '@/models';
import { GROKVIDEO_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IGrokVideoConfig, IGrokVideoTask, Record<string, unknown>>({
  serviceId: GROKVIDEO_SERVICE_ID,
  operator: grokvideoOperator,
  paginated: true,
  type: 'videos'
});

export default actions;
