import { fluxOperator } from '@/operators';
import { IFluxConfig, IFluxTask } from '@/models';
import { FLUX_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IFluxConfig, IFluxTask, Record<string, unknown>>({
  serviceId: FLUX_SERVICE_ID,
  operator: fluxOperator,
  type: 'images'
});

export default actions;
