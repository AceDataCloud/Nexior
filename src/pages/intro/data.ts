export interface ILocalizedImage {
  zh: string;
  en: string;
}

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
    'https://cdn.acedata.cloud/uploads/abb6b06f-392e-4e20-972c-07c3d3be513a',
    'https://cdn.acedata.cloud/uploads/b3123841-e68e-4a1f-aee2-0a6f9d5edf3f'
  ),
  fluxDesktop: image(
    'https://cdn.acedata.cloud/uploads/75d058f3-88d7-41ec-b929-6f37f99dda5a',
    'https://cdn.acedata.cloud/uploads/5057a9d4-a7e1-476b-a44d-2f074a33d816'
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
    'https://cdn.acedata.cloud/uploads/d38ed1b1-5746-474f-8c96-5d09f0be4d07',
    'https://cdn.acedata.cloud/uploads/0afda31c-dcf3-47ff-9176-792904e83643'
  ),
  klingMobile: image(
    'https://cdn.acedata.cloud/uploads/347aa27d-32ae-431e-8f3b-e0b71093295d',
    'https://cdn.acedata.cloud/uploads/ad0d7161-0177-456c-bf9b-c2e6fb80f2f1'
  ),
  veoDesktop: image(
    'https://cdn.acedata.cloud/uploads/84ee7664-491a-4f36-a1fa-4fc36b58e961',
    'https://cdn.acedata.cloud/uploads/52f3d0a9-bef1-4b8a-b8c5-2420b1ffc32c'
  ),
  seedanceDesktop: image(
    'https://cdn.acedata.cloud/uploads/99a7f66a-c4e8-476f-b460-0cff1bcb18d4',
    'https://cdn.acedata.cloud/uploads/ed200f23-df39-4be6-8788-1894d0a704d3'
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
}

export interface IIntroSection {
  key: string;
  eyebrowKey: string;
  titleKey: string;
  subtitleKey: string;
  bulletKeys: string[];
  entries: IIntroEntry[];
  path: string;
  desktop: ILocalizedImage;
  mobile?: ILocalizedImage;
}

export const INTRO_SECTIONS: IIntroSection[] = [
  {
    key: 'chat',
    eyebrowKey: 'intro.eyebrow.chat',
    titleKey: 'intro.title.chat',
    subtitleKey: 'intro.subtitle.chat',
    bulletKeys: ['intro.bullet.chat.models', 'intro.bullet.chat.multimodal', 'intro.bullet.chat.agentic'],
    entries: [
      { name: 'ChatGPT', descriptionKey: 'intro.model.chatgpt' },
      { name: 'Claude', descriptionKey: 'intro.model.claude' },
      { name: 'Gemini', descriptionKey: 'intro.model.gemini' },
      { name: 'Grok', descriptionKey: 'intro.model.grok' },
      { name: 'DeepSeek', descriptionKey: 'intro.model.deepseek' },
      { name: 'Kimi', descriptionKey: 'intro.model.kimi' },
      { name: 'GLM', descriptionKey: 'intro.model.glm' }
    ],
    path: '/chatgpt',
    desktop: INTRO_SHOTS.chatDesktop,
    mobile: INTRO_SHOTS.chatMobile
  },
  {
    key: 'image',
    eyebrowKey: 'intro.eyebrow.image',
    titleKey: 'intro.title.image',
    subtitleKey: 'intro.subtitle.image',
    bulletKeys: ['intro.bullet.image.models', 'intro.bullet.image.editing', 'intro.bullet.image.resolution'],
    entries: [
      { name: 'Midjourney', descriptionKey: 'intro.model.midjourney' },
      { name: 'Nano Banana', descriptionKey: 'intro.model.nanobanana' },
      { name: 'GPT Image', descriptionKey: 'intro.model.gptimage' },
      { name: 'Seedream', descriptionKey: 'intro.model.seedream' },
      { name: 'Flux', descriptionKey: 'intro.model.flux' },
      { name: 'QR Art', descriptionKey: 'intro.model.qrart' }
    ],
    path: '/nanobanana',
    desktop: INTRO_SHOTS.midjourneyDesktop,
    mobile: INTRO_SHOTS.midjourneyMobile
  },
  {
    key: 'video',
    eyebrowKey: 'intro.eyebrow.video',
    titleKey: 'intro.title.video',
    subtitleKey: 'intro.subtitle.video',
    bulletKeys: ['intro.bullet.video.models', 'intro.bullet.video.control', 'intro.bullet.video.quality'],
    entries: [
      { name: 'Kling', descriptionKey: 'intro.model.kling' },
      { name: 'Veo', descriptionKey: 'intro.model.veo' },
      { name: 'Sora', descriptionKey: 'intro.model.sora' },
      { name: 'Seedance', descriptionKey: 'intro.model.seedance' },
      { name: 'Hailuo', descriptionKey: 'intro.model.hailuo' },
      { name: 'Luma', descriptionKey: 'intro.model.luma' },
      { name: 'Wan', descriptionKey: 'intro.model.wan' },
      { name: 'Pixverse', descriptionKey: 'intro.model.pixverse' },
      { name: 'Grok Imagine', descriptionKey: 'intro.model.grokvideo' },
      { name: 'Omni', descriptionKey: 'intro.model.omni' }
    ],
    path: '/kling',
    desktop: INTRO_SHOTS.klingDesktop,
    mobile: INTRO_SHOTS.klingMobile
  },
  {
    key: 'music',
    eyebrowKey: 'intro.eyebrow.music',
    titleKey: 'intro.title.music',
    subtitleKey: 'intro.subtitle.music',
    bulletKeys: ['intro.bullet.music.models', 'intro.bullet.music.control', 'intro.bullet.music.voice'],
    entries: [
      { name: 'Suno', descriptionKey: 'intro.model.suno' },
      { name: 'Producer', descriptionKey: 'intro.model.producer' },
      { name: 'Fish Audio', descriptionKey: 'intro.model.fish' }
    ],
    path: '/suno',
    desktop: INTRO_SHOTS.sunoDesktop,
    mobile: INTRO_SHOTS.sunoMobile
  },
  {
    key: 'production',
    eyebrowKey: 'intro.eyebrow.production',
    titleKey: 'intro.title.production',
    subtitleKey: 'intro.subtitle.production',
    bulletKeys: [
      'intro.bullet.production.oneline',
      'intro.bullet.production.styles',
      'intro.bullet.production.languages'
    ],
    entries: [
      { name: 'Maestro', descriptionKey: 'intro.model.maestro' },
      { name: 'Digital Human', descriptionKey: 'intro.model.digitalhuman' },
      { name: 'Poivelle', descriptionKey: 'intro.model.poivelle' }
    ],
    path: '/maestro',
    desktop: INTRO_SHOTS.maestroDesktop,
    mobile: INTRO_SHOTS.maestroMobile
  },
  {
    key: 'tools',
    eyebrowKey: 'intro.eyebrow.tools',
    titleKey: 'intro.title.tools',
    subtitleKey: 'intro.subtitle.tools',
    bulletKeys: ['intro.bullet.tools.search', 'intro.bullet.tools.extract', 'intro.bullet.tools.coding'],
    entries: [
      { name: 'SERP', descriptionKey: 'intro.model.serp' },
      { name: 'WebExtrator', descriptionKey: 'intro.model.webextrator' },
      { name: 'Coding Bridge', descriptionKey: 'intro.model.codingbridge' }
    ],
    path: '/serp',
    desktop: INTRO_SHOTS.serpDesktop
  }
];
