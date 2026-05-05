import { pikaOperator } from '@/operators';
import { IPikaConfig, IPikaTask } from '@/models';
import { PIKA_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IPikaConfig, IPikaTask, Record<string, unknown>>({
  serviceId: PIKA_SERVICE_ID,
  operator: pikaOperator,
  type: 'videos'
});

export default actions;
