import { IRootState } from './models';
import chatState from '../chat/state';
import midjourneyState from '../midjourney/state';
import qrartState from '../qrart/state';
import lumaState from '../luma/state';
import pikaState from '../pika/state';
import klingState from '../kling/state';
import veoState from '../veo/state';
import soraState from '../sora/state';
import pixverseState from '../pixverse/state';
import fluxState from '../flux/state';
import hailuoState from '../hailuo/state';
import sunoState from '../suno/state';
import producerState from '../producer/state';
import headshotsState from '../headshots/state';
import nanobananaState from '../nanobanana/state';
import openaiimageState from '../openaiimage/state';
import seedreamState from '../seedream/state';
import seedanceState from '../seedance/state';
import serpState from '../serp/state';
import wanState from '../wan/state';
import fishState from '../fish/state';

export default (): IRootState => {
  return {
    applications: [],
    fingerprint: undefined,
    currency: 'usd',
    exchange: undefined,
    user: {},
    auth: {
      flow: 'redirect',
      visible: false
    },
    config: undefined,
    token: {
      access: undefined,
      refresh: undefined,
      expiration: undefined
    },
    status: {
      getService: undefined,
      getApplications: undefined,
      getTasks: undefined
    },
    site: {},
    chat: chatState(),
    midjourney: midjourneyState(),
    qrart: qrartState(),
    luma: lumaState(),
    pika: pikaState(),
    kling: klingState(),
    sora: soraState(),
    veo: veoState(),
    pixverse: pixverseState(),
    flux: fluxState(),
    hailuo: hailuoState(),
    suno: sunoState(),
    producer: producerState(),
    headshots: headshotsState(),
    nanobanana: nanobananaState(),
    openaiimage: openaiimageState(),
    seedream: seedreamState(),
    seedance: seedanceState(),
    serp: serpState(),
    wan: wanState(),
    fish: fishState()
  };
};
