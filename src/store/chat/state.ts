import { CHAT_MODEL_GPT_5_6_LUNA, CHAT_MODEL_GROUP_CHATGPT } from '@/constants';
import { IChatState } from './models';
import { Status } from '@/models';

export default (): IChatState => {
  return {
    model: CHAT_MODEL_GPT_5_6_LUNA,
    modelGroup: CHAT_MODEL_GROUP_CHATGPT,
    applications: undefined,
    application: undefined,
    conversations: undefined,
    service: undefined,
    credential: undefined,
    memoryEnabled: true,
    pendingDraft: '',
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getConversations: Status.None
    }
  };
};
