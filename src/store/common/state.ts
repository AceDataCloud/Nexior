import { IRootState } from './models';
import chatState from '../chat/state';
import midjourneyState from '../midjourney/state';
import chatdocState from '../chatdoc/state';
import qrartState from '../qrart/state';

export default (): IRootState => {
  return {
    currency: 'usd',
    exchange: undefined,
    user: {},
    token: {
      access: undefined,
      refresh: undefined,
      expiration: undefined
    },
    setting: {},
    site: {},
    chatdoc: chatdocState(),
    chat: chatState(),
    midjourney: midjourneyState(),
    qrart: qrartState()
  };
};
