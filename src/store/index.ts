import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import midjourney from './midjourney';
import chat from './chat';
import qrart from './qrart';
import luma from './luma';
import pika from './pika';
import kling from './kling';
import veo from './veo';
import sora from './sora';
import pixverse from './pixverse';
import flux from './flux';
import hailuo from './hailuo';
import headshots from './headshots';
import suno from './suno';
import producer from './producer';
import nanobanana from './nanobanana';
import seedream from './seedream';
import seedance from './seedance';
import serp from './serp';
import wan from './wan';
import root from './common';
import persistChat from './chat/persist';
import persistMidjourney from './midjourney/persist';
import persistQrart from './qrart/persist';
import persistLuma from './luma/persist';
import persistPika from './pika/persist';
import persistKling from './kling/persist';
import persistVeo from './veo/persist';
import persistSora from './sora/persist';
import persistPixverse from './pixverse/persist';
import persistFlux from './flux/persist';
import persistHailuo from './hailuo/persist';
import persistHeadshots from './headshots/persist';
import persistSuno from './suno/persist';
import persistProducer from './producer/persist';
import persistNanobanana from './nanobanana/persist';
import persistSeedream from './seedream/persist';
import persistSeedance from './seedance/persist';
import persistSerp from './serp/persist';
import persistWan from './wan/persist';
import persistRoot from './common/persist';

const store = createStore({
  ...root,
  modules: {
    midjourney: midjourney,
    chat: chat,
    qrart: qrart,
    luma: luma,
    pika: pika,
    kling: kling,
    veo: veo,
    sora: sora,
    pixverse: pixverse,
    flux: flux,
    hailuo: hailuo,
    headshots: headshots,
    suno: suno,
    producer: producer,
    nanobanana: nanobanana,
    seedream: seedream,
    seedance: seedance,
    serp: serp,
    wan: wan
  },
  plugins: [
    createPersistedState({
      paths: [
        ...persistRoot,
        ...persistChat,
        ...persistMidjourney,
        ...persistQrart,
        ...persistLuma,
        ...persistPika,
        ...persistKling,
        ...persistVeo,
        ...persistSora,
        ...persistPixverse,
        ...persistFlux,
        ...persistHailuo,
        ...persistHeadshots,
        ...persistSuno,
        ...persistProducer,
        ...persistNanobanana,
        ...persistSeedream,
        ...persistSeedance,
        ...persistSerp,
        ...persistWan
      ]
    })
  ]
});

export default store;
