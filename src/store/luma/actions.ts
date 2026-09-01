import { lumaOperator } from '@/operators';
import { ILumaConfig, ILumaTask } from '@/models';
import { LUMA_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingByResponseState } from '@/store/factories/taskPolling';

const actions = createTaskActions<ILumaConfig, ILumaTask, Record<string, unknown>>({
  serviceId: LUMA_SERVICE_ID,
  operator: lumaOperator,
  isPending: pendingByResponseState
});

export default actions;
