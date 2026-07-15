import { omniOperator } from '@/operators';
import { IOmniConfig, IOmniTask } from '@/models';
import { OMNI_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IOmniConfig, IOmniTask, Record<string, unknown>>({
  serviceId: OMNI_SERVICE_ID,
  operator: omniOperator,
  paginated: true,
  type: 'videos'
});

export default actions;
