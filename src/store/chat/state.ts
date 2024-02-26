import { CHAT_MODEL_GPT_3_5 } from '@/operators';
import { IChatState } from './models';

export default (): IChatState => {
  return {
    model: CHAT_MODEL_GPT_3_5,
    application: undefined,
    conversations: undefined
  };
};
