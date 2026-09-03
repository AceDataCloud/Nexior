import { minimaxOperator } from '@/operators';
import { IMinimaxConfig, IMinimaxVideoTask } from '@/models';
import { MINIMAX_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingByTopLevelStatus } from '@/store/factories/taskPolling';

const actions = createTaskActions<IMinimaxConfig, IMinimaxVideoTask, Record<string, unknown>>({
  serviceId: MINIMAX_SERVICE_ID,
  operator: minimaxOperator,
  isPending: pendingByTopLevelStatus,
  type: 'videos'
});

export default actions;
