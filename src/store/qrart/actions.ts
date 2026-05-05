import { qrartOperator } from '@/operators';
import { IQrartConfig, IQrartTask } from '@/models';
import { QRART_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IQrartConfig, IQrartTask, Record<string, unknown>>({
  serviceId: QRART_SERVICE_ID,
  operator: qrartOperator
});

export default actions;
