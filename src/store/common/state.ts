import { IRootState } from './models';
import chatState from '../chat/state';
import midjourneyState from '../midjourney/state';
import chatdocState from '../chatdoc/state';
import qrartState from '../qrart/state';

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
    chatdoc: chatdocState(),
    chat: chatState(),
    midjourney: midjourneyState(),
    qrart: qrartState()
  };
};
