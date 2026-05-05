import { pixverseOperator } from '@/operators';
import { IPixverseConfig, IPixverseTask } from '@/models';
import { PIXVERSE_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IPixverseConfig, IPixverseTask, Record<string, unknown>>({
  serviceId: PIXVERSE_SERVICE_ID,
  operator: pixverseOperator,
  type: 'videos'
});

export default actions;
