import { wanOperator } from '@/operators';
import { IWanConfig, IWanTask } from '@/models';
import { WAN_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IWanConfig, IWanTask, Record<string, unknown>>({
  serviceId: WAN_SERVICE_ID,
  operator: wanOperator,
  type: 'videos'
});

export default actions;
