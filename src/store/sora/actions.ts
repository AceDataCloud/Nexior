import { soraOperator } from '@/operators';
import { ISoraConfig, ISoraTask } from '@/models';
import { SORA_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<ISoraConfig, ISoraTask, Record<string, unknown>>({
  serviceId: SORA_SERVICE_ID,
  operator: soraOperator,
  type: 'videos'
});

export default actions;
