import { openaiimageOperator } from '@/operators';
import { IOpenAIImageConfig, IOpenAIImageTask } from '@/models';
import { OPENAIIMAGE_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';

const actions = createTaskActions<IOpenAIImageConfig, IOpenAIImageTask, Record<string, unknown>>({
  serviceId: OPENAIIMAGE_SERVICE_ID,
  operator: openaiimageOperator,
  paginated: true
});

export default actions;
