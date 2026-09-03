import { fluxOperator } from '@/operators';
import { IFluxConfig, IFluxTask } from '@/models';
import { FLUX_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingUntilResponse } from '@/store/factories/taskPolling';

const actions = createTaskActions<IFluxConfig, IFluxTask, Record<string, unknown>>({
  serviceId: FLUX_SERVICE_ID,
  operator: fluxOperator,
  isPending: pendingUntilResponse,
  type: 'images'
});

export default actions;
