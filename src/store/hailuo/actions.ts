import { hailuoOperator } from '@/operators';
import { IHailuoConfig, IHailuoTask } from '@/models';
import { HAILUO_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingByResponseState } from '@/store/factories/taskPolling';

const actions = createTaskActions<IHailuoConfig, IHailuoTask, Record<string, unknown>>({
  serviceId: HAILUO_SERVICE_ID,
  operator: hailuoOperator,
  isPending: pendingByResponseState,
  type: 'videos'
});

export default actions;
