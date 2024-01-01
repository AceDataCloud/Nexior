import { IRootState } from './models';
import chatState from '../chat/state';
import midjourneyState from '../midjourney/state';

export default (): IRootState => {
  return {
    user: {},
    token: {
      access: undefined,
      refresh: undefined,
      expiration: undefined
    },
    chat: chatState(),
    midjourney: midjourneyState()
  };
};
