import { maestroOperator } from '@/operators';
import { IMaestroConfig, IMaestroTask } from '@/models';
import { MAESTRO_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IMaestroConfig, IMaestroTask, Record<string, unknown>>({
  serviceId: MAESTRO_SERVICE_ID,
  operator: maestroOperator,
  type: 'videos'
});

export default actions;
