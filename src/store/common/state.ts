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
    setting: {
      // if PC, set default to true, else false
      navigationCollapsed: window.innerWidth < 768
    },
    chat: chatState(),
    midjourney: midjourneyState()
  };
};
