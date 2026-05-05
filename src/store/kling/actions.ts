import { klingOperator } from '@/operators';
import { IKlingConfig, IKlingMotionConfig, IKlingTask, IKlingTaskType } from '@/models';
import { KLING_SERVICE_ID } from '@/constants';
import { createTaskActions, IGetTasksArgs } from '@/store/factories/createTaskActions';
import { ITaskListFilter } from '@/operators/baseTaskOperator';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IKlingState } from './models';

type KlingTasksFilter = ITaskListFilter & { type?: IKlingTaskType };

const baseActions = createTaskActions<IKlingConfig, IKlingTask, KlingTasksFilter>({
  serviceId: KLING_SERVICE_ID,
  operator: klingOperator,
  buildFilter: (rootState, args: IGetTasksArgs): KlingTasksFilter => ({
    userId: rootState?.user?.id,
    createdAtMin: args.createdAtMin,
    createdAtMax: args.createdAtMax,
    type: rootState?.kling?.taskType
  })
});

const setMotionConfig = ({ commit }: ActionContext<IKlingState, IRootState>, payload: IKlingMotionConfig): void => {
  commit('setMotionConfig', payload);
};

const setTaskType = ({ commit }: ActionContext<IKlingState, IRootState>, payload: IKlingTaskType): void => {
  commit('setTaskType', payload);
};

const actions = {
  ...baseActions,
  setMotionConfig,
  setTaskType
};

export default actions;
