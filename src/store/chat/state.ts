import { CHAT_MODEL_GPT_3_5 } from '@/constants';
import { IChatState } from './models';
import { Status } from '@/models';

export default (): IChatState => {
  return {
    model: CHAT_MODEL_GPT_3_5,
    application: undefined,
    conversations: undefined,
    service: undefined,
    credential: undefined,
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getConversations: Status.None
    }
  };
};
