import { hailuoOperator } from '@/operators';
import { IHailuoConfig, IHailuoTask } from '@/models';
import { HAILUO_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IHailuoConfig, IHailuoTask, Record<string, unknown>>({
  serviceId: HAILUO_SERVICE_ID,
  operator: hailuoOperator,
  type: 'videos'
});

export default actions;
