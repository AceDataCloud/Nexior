import { lumaOperator } from '@/operators';
import { ILumaConfig, ILumaTask } from '@/models';
import { LUMA_SERVICE_ID } from '@/constants';
import { createTaskActions, IGetTasksArgs } from '@/store/factories/createTaskActions';
import { IRootState } from '../common/models';

interface ILumaTasksFilter {
  userId?: string;
  createdAtMin?: number;
  createdAtMax?: number;
}

const buildFilter = (rootState: IRootState, args: IGetTasksArgs): ILumaTasksFilter => ({
  userId: rootState?.user?.id,
  createdAtMin: args.createdAtMin,
  createdAtMax: args.createdAtMax
});

const actions = createTaskActions<ILumaConfig, ILumaTask, ILumaTasksFilter>({
  serviceId: LUMA_SERVICE_ID,
  operator: lumaOperator,
  buildFilter
});

export default actions;
