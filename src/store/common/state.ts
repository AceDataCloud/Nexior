import { IRootState } from './models';
import chatState from '../chat/state';
import midjourneyState from '../midjourney/state';
import chatdocState from '../chatdoc/state';
import qrartState from '../qrart/state';
import lumaState from '../luma/state';
import pikaState from '../pika/state';
import klingState from '../kling/state';
import fluxState from '../flux/state';
import hailuoState from '../hailuo/state';
import sunoState from '../suno/state';
import headshotsState from '../headshots/state';

export default (): IRootState => {
  return {
    fingerprint: undefined,
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
    pika: pikaState(),
    kling: klingState(),
    flux: fluxState(),
    hailuo: hailuoState(),
    suno: sunoState(),
    headshots: headshotsState()
  };
};
