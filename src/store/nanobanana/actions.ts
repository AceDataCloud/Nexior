import { nanobananaOperator } from '@/operators';
import { INanobananaConfig, INanobananaTask } from '@/models';
import { NANOBANANA_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<INanobananaConfig, INanobananaTask, Record<string, unknown>>({
  serviceId: NANOBANANA_SERVICE_ID,
  operator: nanobananaOperator,
  paginated: true,
  type: 'images'
});

export default actions;
