import { seedanceOperator } from '@/operators';
import { ISeedanceConfig, ISeedanceTask } from '@/models';
import { SEEDANCE_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<ISeedanceConfig, ISeedanceTask, Record<string, unknown>>({
  serviceId: SEEDANCE_SERVICE_ID,
  operator: seedanceOperator,
  paginated: true,
  type: 'videos'
});

export default actions;
