import { digitalHumanOperator } from '@/operators';
import { IDigitalHumanConfig, IDigitalHumanTask } from '@/models';
import { DIGITALHUMAN_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IDigitalHumanConfig, IDigitalHumanTask, Record<string, unknown>>({
  serviceId: DIGITALHUMAN_SERVICE_ID,
  operator: digitalHumanOperator,
  type: 'videos'
});

export default actions;
