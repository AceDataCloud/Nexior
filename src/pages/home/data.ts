export interface ILocalizedImage {
  zh: string;
  en: string;
}

import { CHAT_MODEL_ICON_GLM } from '@/constants/chat';
import type { CapabilityKey } from '@/constants/capabilities';

const image = (zh: string, en: string): ILocalizedImage => ({ zh, en });

// Captured from the live product (desktop + mobile, zh + en) and uploaded to the
// CDN. `zh` is used for Chinese locales, `en` for every other language.
export const INTRO_SHOTS = {
  chatDesktop: image(
    'https://cdn.acedata.cloud/uploads/24b9ad71-e5c0-4550-b950-d52e73d74926',
    'https://cdn.acedata.cloud/uploads/850faad3-4acd-4a4f-9f1a-29ca77119274'
  ),
  chatMobile: image(
    'https://cdn.acedata.cloud/uploads/4bf02973-6482-4c5b-8174-83740d22ecca',
    'https://cdn.acedata.cloud/uploads/1401bef2-4588-429a-9d5e-c3655a6a51a7'
  ),
  midjourneyDesktop: image(
    'https://cdn.acedata.cloud/uploads/d5d1566f-893c-4dac-bf3d-3b181b7e8ab3',
    'https://cdn.acedata.cloud/uploads/21379382-9aef-4597-8d6f-6bad33375943'
  ),
  midjourneyMobile: image(
    'https://cdn.acedata.cloud/uploads/0671efb0-5f62-461c-b3a7-8b8eb08a6c39',
    'https://cdn.acedata.cloud/uploads/93be4fb8-24bc-47f1-9fea-2d6504ec17f7'
  ),
  nanobananaDesktop: image(
    'https://cdn.acedata.cloud/uploads/089b6deb-1ff1-4cf5-b938-36a2493a40da',
    'https://cdn.acedata.cloud/uploads/165db012-430e-455c-844e-cd88bc88f60c'
  ),
  nanobananaMobile: image(
    'https://cdn.acedata.cloud/uploads/8154ce9b-f221-4543-86c8-7e4556ee1917',
    'https://cdn.acedata.cloud/uploads/6358331d-acf7-4784-b4f0-4f15189f9876'
  ),
  seedreamDesktop: image(
    'https://cdn.acedata.cloud/uploads/7e45490e-8b41-48e9-9d31-dfae7072a7fa',
    'https://cdn.acedata.cloud/uploads/91c96b92-31ff-4e99-bdd7-5314d1781246'
  ),
  fluxDesktop: image(
    'https://cdn.acedata.cloud/uploads/7f7caa8d-5d61-4c03-9b14-14ddc865be5a',
    'https://cdn.acedata.cloud/uploads/63e300df-a3c1-43c7-b170-6fd3fdfe15b5'
  ),
  sunoDesktop: image(
    'https://cdn.acedata.cloud/uploads/5ab7f19e-2047-4c62-a228-ae4170ca58b0',
    'https://cdn.acedata.cloud/uploads/6e962c96-1b2c-4e17-a791-e1c4a7929ba3'
  ),
  sunoMobile: image(
    'https://cdn.acedata.cloud/uploads/f3a06507-d4fa-4568-9803-cfacfa39cfd6',
    'https://cdn.acedata.cloud/uploads/aff42de2-62fe-43ad-9dd7-ceac814880e5'
  ),
  fishDesktop: image(
    'https://cdn.acedata.cloud/uploads/db375091-7ddc-4d36-a4f8-db13fe1df424',
    'https://cdn.acedata.cloud/uploads/d50b6bcd-e6a3-4863-a964-c68f259c4ae0'
  ),
  klingDesktop: image(
    'https://cdn.acedata.cloud/uploads/fd38b6c8-9794-4414-884c-9ca9619c7da6',
    'https://cdn.acedata.cloud/uploads/3531e27b-58d8-4c65-9010-148b7c785560'
  ),
  klingMobile: image(
    'https://cdn.acedata.cloud/uploads/3abfa61f-d735-4a1d-b983-8b09a9c9e5f0',
    'https://cdn.acedata.cloud/uploads/c3cb4afb-f554-4031-8f8b-c91359906f18'
  ),
  veoDesktop: image(
    'https://cdn.acedata.cloud/uploads/e8291d40-e2d1-465e-88b6-3febbbba9a9b',
    'https://cdn.acedata.cloud/uploads/efc32760-db07-439d-beff-ceaef735c3b4'
  ),
  seedanceDesktop: image(
    'https://cdn.acedata.cloud/uploads/26a91d87-e267-4e39-9bbd-a2c5c8ec0cdc',
    'https://cdn.acedata.cloud/uploads/8fd9cdc3-41f8-4d2f-9f32-60d083683307'
  ),
  maestroDesktop: image(
    'https://cdn.acedata.cloud/uploads/e20d1a42-7824-4803-b6b6-8d121a7eb713',
    'https://cdn.acedata.cloud/uploads/3b6887f8-5be1-4a19-9fcc-45ec6d695af0'
  ),
  maestroMobile: image(
    'https://cdn.acedata.cloud/uploads/72648704-4c8e-40b4-9a60-70cbecc76401',
    'https://cdn.acedata.cloud/uploads/12879735-e957-4c04-a30a-e6f463435bd7'
  ),
  digitalHumanDesktop: image(
    'https://cdn.acedata.cloud/uploads/3a49d5fa-cd7a-4fb6-a6c0-e4f0a6d56d4d',
    'https://cdn.acedata.cloud/uploads/b2ce6c5c-56d3-45e7-9d9e-598b5dfd9ae4'
  ),
  serpDesktop: image(
    'https://cdn.acedata.cloud/uploads/8ccda980-60e5-4db7-9d99-66628ced5c44',
    'https://cdn.acedata.cloud/uploads/94c23b79-4af7-4afd-9deb-1ac760e01950'
  ),
  webextratorDesktop: image(
    'https://cdn.acedata.cloud/uploads/e1b19df4-1720-4674-abdd-9db0f7f529b2',
    'https://cdn.acedata.cloud/uploads/6c9e4c43-d0bc-4a63-ba9e-4e9fbbd6b245'
  ),
  codingBridgeDesktop: image(
    'https://cdn.acedata.cloud/uploads/ef0be118-adfa-4814-b672-a6977915e7f0',
    'https://cdn.acedata.cloud/uploads/97d60828-c1c1-4ebb-a219-30bbed1e6353'
  ),
  connectorsDesktop: image(
    'https://cdn.acedata.cloud/uploads/5a5ce9af-8a88-44c5-9262-dbf276aa5058',
    'https://cdn.acedata.cloud/uploads/fb40fc97-9177-4778-b02a-0f2f1f37ad6c'
  )
};

export interface IIntroEntry {
  /** Public product / model name. Never an upstream provider name. */
  name: string;
  descriptionKey: string;
  /** Site feature flag gating this entry; omitted entries are always shown. */
  featureKey?: CapabilityKey;
  /** Override when the product does not have its own capability key (for example GLM). */
  icon?: string;
  /** Route for this entry, used to retarget the section CTA when the section's
   *  default destination is disabled for the site. */
  path?: string;
}

export interface IIntroBullet {
  key: string;
  /** Show on configured sites only when at least one related feature is enabled. */
  featureKeys?: CapabilityKey[];
  /** Full-catalog claims (for example "ten engines") are hidden on configured sites. */
  catalogOnly?: boolean;
}

export interface IIntroScreenshot {
  desktop: ILocalizedImage;
  mobile?: ILocalizedImage;
}

export interface IIntroSection {
  key: string;
  /** Section is hidden when none of these features are enabled for the site. */
  featureKeys: CapabilityKey[];
  eyebrowKey: string;
  titleKey: string;
  /** Neutral title used when a site's enabled subset is known. */
  siteTitleKey: string;
  subtitleKey: string;
  bullets: IIntroBullet[];
  entries: IIntroEntry[];
  path: string;
  /** Screenshots keyed by the capability actually visible in the image. */
  screenshots: Partial<Record<CapabilityKey, IIntroScreenshot>>;
}

export const INTRO_SECTIONS: IIntroSection[] = [
  {
    key: 'chat',
    featureKeys: ['chatgpt', 'claude', 'gemini', 'grok', 'deepseek', 'kimi'],
    eyebrowKey: 'intro.eyebrow.chat',
    titleKey: 'intro.title.chat',
    siteTitleKey: 'intro.title.site.chat',
    subtitleKey: 'intro.subtitle.chat',
    bullets: [
      { key: 'intro.bullet.chat.models', catalogOnly: true },
      { key: 'intro.bullet.chat.multimodal' },
      { key: 'intro.bullet.chat.agentic' }
    ],
    entries: [
      { name: 'ChatGPT', descriptionKey: 'intro.model.chatgpt', featureKey: 'chatgpt', path: '/chatgpt' },
      { name: 'Claude', descriptionKey: 'intro.model.claude', featureKey: 'claude', path: '/claude' },
      { name: 'Gemini', descriptionKey: 'intro.model.gemini', featureKey: 'gemini', path: '/gemini' },
      { name: 'Grok', descriptionKey: 'intro.model.grok', featureKey: 'grok', path: '/grok' },
      { name: 'DeepSeek', descriptionKey: 'intro.model.deepseek', featureKey: 'deepseek', path: '/deepseek' },
      { name: 'Kimi', descriptionKey: 'intro.model.kimi', featureKey: 'kimi', path: '/kimi' },
      // GLM has no capability key of its own; it rides the ChatGPT surface, so
      // gate it on that rather than letting it survive a chat-less subsite.
      {
        name: 'GLM',
        descriptionKey: 'intro.model.glm',
        featureKey: 'chatgpt',
        icon: CHAT_MODEL_ICON_GLM,
        path: '/chatgpt'
      }
    ],
    path: '/chatgpt',
    screenshots: {
      chatgpt: { desktop: INTRO_SHOTS.chatDesktop, mobile: INTRO_SHOTS.chatMobile }
    }
  },
  {
    key: 'image',
    featureKeys: ['midjourney', 'nanobanana', 'openaiimage', 'seedream', 'flux', 'qrart'],
    eyebrowKey: 'intro.eyebrow.image',
    titleKey: 'intro.title.image',
    siteTitleKey: 'intro.title.site.image',
    subtitleKey: 'intro.subtitle.image',
    bullets: [
      { key: 'intro.bullet.image.models', catalogOnly: true },
      { key: 'intro.bullet.image.editing', featureKeys: ['nanobanana', 'openaiimage', 'seedream'] },
      { key: 'intro.bullet.image.resolution', featureKeys: ['nanobanana', 'openaiimage', 'seedream'] }
    ],
    entries: [
      { name: 'Midjourney', descriptionKey: 'intro.model.midjourney', featureKey: 'midjourney', path: '/midjourney' },
      { name: 'Nano Banana', descriptionKey: 'intro.model.nanobanana', featureKey: 'nanobanana', path: '/nanobanana' },
      { name: 'GPT Image', descriptionKey: 'intro.model.gptimage', featureKey: 'openaiimage', path: '/openaiimage' },
      { name: 'Seedream', descriptionKey: 'intro.model.seedream', featureKey: 'seedream', path: '/seedream' },
      { name: 'Flux', descriptionKey: 'intro.model.flux', featureKey: 'flux', path: '/flux' },
      { name: 'QR Art', descriptionKey: 'intro.model.qrart', featureKey: 'qrart', path: '/qrart' }
    ],
    path: '/nanobanana',
    screenshots: {
      midjourney: { desktop: INTRO_SHOTS.midjourneyDesktop, mobile: INTRO_SHOTS.midjourneyMobile },
      nanobanana: { desktop: INTRO_SHOTS.nanobananaDesktop, mobile: INTRO_SHOTS.nanobananaMobile },
      seedream: { desktop: INTRO_SHOTS.seedreamDesktop },
      flux: { desktop: INTRO_SHOTS.fluxDesktop }
    }
  },
  {
    key: 'video',
    featureKeys: [
      'kling',
      'veo',
      'sora',
      'seedance',
      'hailuo',
      'minimax',
      'luma',
      'wan',
      'pixverse',
      'grokvideo',
      'omni'
    ],
    eyebrowKey: 'intro.eyebrow.video',
    titleKey: 'intro.title.video',
    siteTitleKey: 'intro.title.site.video',
    subtitleKey: 'intro.subtitle.video',
    bullets: [
      { key: 'intro.bullet.video.models', catalogOnly: true },
      { key: 'intro.bullet.video.control', featureKeys: ['kling', 'veo', 'seedance', 'luma'] },
      { key: 'intro.bullet.video.quality', featureKeys: ['kling', 'seedance', 'grokvideo'] }
    ],
    entries: [
      { name: 'Kling', descriptionKey: 'intro.model.kling', featureKey: 'kling', path: '/kling' },
      { name: 'Veo', descriptionKey: 'intro.model.veo', featureKey: 'veo', path: '/veo' },
      { name: 'Sora', descriptionKey: 'intro.model.sora', featureKey: 'sora', path: '/sora' },
      { name: 'Seedance', descriptionKey: 'intro.model.seedance', featureKey: 'seedance', path: '/seedance' },
      { name: 'Hailuo', descriptionKey: 'intro.model.hailuo', featureKey: 'hailuo', path: '/hailuo' },
      { name: 'MiniMax H3', descriptionKey: 'intro.model.minimax', featureKey: 'minimax', path: '/minimax' },
      { name: 'Luma', descriptionKey: 'intro.model.luma', featureKey: 'luma', path: '/luma' },
      { name: 'Wan', descriptionKey: 'intro.model.wan', featureKey: 'wan', path: '/wan' },
      { name: 'Pixverse', descriptionKey: 'intro.model.pixverse', featureKey: 'pixverse', path: '/pixverse' },
      { name: 'Grok Imagine', descriptionKey: 'intro.model.grokvideo', featureKey: 'grokvideo', path: '/grokvideo' },
      { name: 'Omni', descriptionKey: 'intro.model.omni', featureKey: 'omni', path: '/omni' }
    ],
    path: '/kling',
    screenshots: {
      kling: { desktop: INTRO_SHOTS.klingDesktop, mobile: INTRO_SHOTS.klingMobile },
      veo: { desktop: INTRO_SHOTS.veoDesktop },
      seedance: { desktop: INTRO_SHOTS.seedanceDesktop }
    }
  },
  {
    key: 'music',
    featureKeys: ['suno', 'producer', 'fish'],
    eyebrowKey: 'intro.eyebrow.music',
    titleKey: 'intro.title.music',
    siteTitleKey: 'intro.title.site.music',
    subtitleKey: 'intro.subtitle.music',
    bullets: [
      { key: 'intro.bullet.music.models' },
      { key: 'intro.bullet.music.control', featureKeys: ['suno', 'producer'] },
      { key: 'intro.bullet.music.voice', featureKeys: ['fish'] }
    ],
    entries: [
      { name: 'Suno', descriptionKey: 'intro.model.suno', featureKey: 'suno', path: '/suno' },
      { name: 'Producer', descriptionKey: 'intro.model.producer', featureKey: 'producer', path: '/producer' },
      { name: 'Fish Audio', descriptionKey: 'intro.model.fish', featureKey: 'fish', path: '/fish' }
    ],
    path: '/suno',
    screenshots: {
      suno: { desktop: INTRO_SHOTS.sunoDesktop, mobile: INTRO_SHOTS.sunoMobile },
      fish: { desktop: INTRO_SHOTS.fishDesktop }
    }
  },
  {
    key: 'production',
    featureKeys: ['maestro', 'digitalhuman', 'poivelle'],
    eyebrowKey: 'intro.eyebrow.production',
    titleKey: 'intro.title.production',
    siteTitleKey: 'intro.title.site.production',
    subtitleKey: 'intro.subtitle.production',
    bullets: [
      { key: 'intro.bullet.production.oneline', featureKeys: ['maestro'] },
      { key: 'intro.bullet.production.styles', featureKeys: ['maestro', 'digitalhuman', 'poivelle'] },
      { key: 'intro.bullet.production.languages', featureKeys: ['maestro', 'digitalhuman'] }
    ],
    entries: [
      { name: 'Maestro', descriptionKey: 'intro.model.maestro', featureKey: 'maestro', path: '/maestro' },
      {
        name: 'Digital Human',
        descriptionKey: 'intro.model.digitalhuman',
        featureKey: 'digitalhuman',
        path: '/digital-human'
      },
      { name: 'Poivelle', descriptionKey: 'intro.model.poivelle', featureKey: 'poivelle', path: '/poivelle' }
    ],
    path: '/maestro',
    screenshots: {
      maestro: { desktop: INTRO_SHOTS.maestroDesktop, mobile: INTRO_SHOTS.maestroMobile },
      digitalhuman: { desktop: INTRO_SHOTS.digitalHumanDesktop }
    }
  },
  {
    key: 'tools',
    featureKeys: ['serp', 'webextrator', 'codingBridge'],
    eyebrowKey: 'intro.eyebrow.tools',
    titleKey: 'intro.title.tools',
    siteTitleKey: 'intro.title.site.tools',
    subtitleKey: 'intro.subtitle.tools',
    bullets: [
      { key: 'intro.bullet.tools.search', featureKeys: ['serp'] },
      { key: 'intro.bullet.tools.extract', featureKeys: ['webextrator'] },
      { key: 'intro.bullet.tools.coding', featureKeys: ['codingBridge'] }
    ],
    entries: [
      { name: 'SERP', descriptionKey: 'intro.model.serp', featureKey: 'serp', path: '/serp' },
      {
        name: 'WebExtrator',
        descriptionKey: 'intro.model.webextrator',
        featureKey: 'webextrator',
        path: '/webextrator'
      },
      {
        name: 'Coding Bridge',
        descriptionKey: 'intro.model.codingbridge',
        featureKey: 'codingBridge',
        path: '/coding-bridge'
      }
    ],
    path: '/serp',
    screenshots: {
      serp: { desktop: INTRO_SHOTS.serpDesktop },
      webextrator: { desktop: INTRO_SHOTS.webextratorDesktop },
      codingBridge: { desktop: INTRO_SHOTS.codingBridgeDesktop }
    }
  }
];
