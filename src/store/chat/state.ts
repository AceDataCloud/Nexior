import { CHAT_MODEL_GROUP_CHATGPT, getDefaultChatModel } from '@/constants';
import { IChatState } from './models';
import { Status } from '@/models';

export default (): IChatState => {
  return {
    model: getDefaultChatModel(CHAT_MODEL_GROUP_CHATGPT),
    modelGroup: CHAT_MODEL_GROUP_CHATGPT,
    applications: undefined,
    application: undefined,
    conversations: undefined,
    service: undefined,
    credential: undefined,
    memoryEnabled: true,
    workingDirectory: '',
    pendingDraft: '',
    status: {
      getService: Status.None,
      getApplications: Status.None,
      getConversations: Status.None
    }
  };
};
