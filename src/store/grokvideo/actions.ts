import { grokvideoOperator } from '@/operators';
import { IGrokVideoConfig, IGrokVideoTask } from '@/models';
import { GROKVIDEO_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingByResponseState } from '@/store/factories/taskPolling';

const actions = createTaskActions<IGrokVideoConfig, IGrokVideoTask, Record<string, unknown>>({
  serviceId: GROKVIDEO_SERVICE_ID,
  operator: grokvideoOperator,
  isPending: pendingByResponseState,
  paginated: true,
  type: 'videos'
});

export default actions;
