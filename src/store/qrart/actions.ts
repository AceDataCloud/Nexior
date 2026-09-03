import { qrartOperator } from '@/operators';
import { IQrartConfig, IQrartTask } from '@/models';
import { QRART_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingUntilResponse } from '@/store/factories/taskPolling';

const actions = createTaskActions<IQrartConfig, IQrartTask, Record<string, unknown>>({
  serviceId: QRART_SERVICE_ID,
  operator: qrartOperator,
  isPending: pendingUntilResponse
});

export default actions;
