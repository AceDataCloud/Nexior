import { IChatState } from './models';

export default (): IChatState => {
  return {
    applications: undefined,
    getApplicationsStatus: undefined,
    conversations: undefined,
    getConversationsStatus: undefined
  };
};
