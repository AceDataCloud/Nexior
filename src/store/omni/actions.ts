import { omniOperator } from '@/operators';
import { IOmniConfig, IOmniTask } from '@/models';
import { OMNI_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingByResponseState } from '@/store/factories/taskPolling';

const actions = createTaskActions<IOmniConfig, IOmniTask, Record<string, unknown>>({
  serviceId: OMNI_SERVICE_ID,
  operator: omniOperator,
  isPending: pendingByResponseState,
  paginated: true,
  type: 'videos'
});

export default actions;
