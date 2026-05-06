import { headshotsOperator } from '@/operators';
import { IHeadshotsConfig, IHeadshotsTask } from '@/models';
import { HEADSHOTS_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IHeadshotsConfig, IHeadshotsTask, Record<string, unknown>>({
  serviceId: HEADSHOTS_SERVICE_ID,
  operator: headshotsOperator
});

export default actions;
