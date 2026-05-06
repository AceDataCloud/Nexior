import { lumaOperator } from '@/operators';
import { ILumaConfig, ILumaTask } from '@/models';
import { LUMA_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<ILumaConfig, ILumaTask, Record<string, unknown>>({
  serviceId: LUMA_SERVICE_ID,
  operator: lumaOperator
});

export default actions;
