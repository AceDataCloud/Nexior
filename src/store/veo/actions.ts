import { veoOperator } from '@/operators';
import { IVeoConfig, IVeoTask } from '@/models';
import { VEO_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingByResponseState } from '@/store/factories/taskPolling';

// No `type` filter: /veo/tasks returns the user's generated videos.
const actions = createTaskActions<IVeoConfig, IVeoTask, Record<string, unknown>>({
  serviceId: VEO_SERVICE_ID,
  operator: veoOperator,
  isPending: pendingByResponseState
});

export default actions;
