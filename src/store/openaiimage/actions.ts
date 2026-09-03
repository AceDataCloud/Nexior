import { openaiimageOperator } from '@/operators';
import { IOpenAIImageConfig, IOpenAIImageTask } from '@/models';
import { OPENAIIMAGE_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { pendingUntilResponse } from '@/store/factories/taskPolling';

const actions = createTaskActions<IOpenAIImageConfig, IOpenAIImageTask, Record<string, unknown>>({
  serviceId: OPENAIIMAGE_SERVICE_ID,
  operator: openaiimageOperator,
  isPending: pendingUntilResponse,
  paginated: true,
  countMode: 'none'
});

export default actions;
