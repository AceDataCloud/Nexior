import { CHAT_MODEL_CHATGPT } from '@/operators';
import { IChatState } from './models';

export default (): IChatState => {
  return {
    model: CHAT_MODEL_CHATGPT,
    applications: undefined,
    getApplicationsStatus: undefined,
    conversations: undefined,
    getConversationsStatus: undefined
  };
};
