import { veoOperator } from '@/operators';
import { IVeoConfig, IVeoTask } from '@/models';
import { VEO_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IVeoConfig, IVeoTask, Record<string, unknown>>({
  serviceId: VEO_SERVICE_ID,
  operator: veoOperator,
  type: 'videos'
});

export default actions;
