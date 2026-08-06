import { minimaxOperator } from '@/operators';
import { IMinimaxConfig, IMinimaxTask } from '@/models';
import { MINIMAX_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IMinimaxConfig, IMinimaxTask, Record<string, unknown>>({
  serviceId: MINIMAX_SERVICE_ID,
  operator: minimaxOperator,
  type: 'videos'
});

export default actions;
