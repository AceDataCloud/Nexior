import { IRootState } from './models';
import chatState from '../chat/state';
import midjourneyState from '../midjourney/state';
import chatdocState from '../chatdoc/state';
import qrartState from '../qrart/state';
import lumaState from '../luma/state';
import sunoState from '../suno/state';

export default (): IRootState => {
  return {
    currency: 'usd',
    exchange: undefined,
    user: {},
    auth: {
      flow: 'redirect',
      visible: false
    },
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
    qrart: qrartState(),
    luma: lumaState(),
    suno: sunoState()
  };
};
