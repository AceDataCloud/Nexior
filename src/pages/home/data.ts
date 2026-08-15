import type { CapabilityKey } from '@/constants/capabilities';

export interface ILocalizedImage {
  zh: string;
  en: string;
}

const image = (zh: string, en: string): ILocalizedImage => ({ zh, en });

// Captured from the live product and hosted on the Ace Data Cloud CDN.
export const HOME_SHOTS = {
  chat: image(
    'https://cdn.acedata.cloud/uploads/24b9ad71-e5c0-4550-b950-d52e73d74926',
    'https://cdn.acedata.cloud/uploads/850faad3-4acd-4a4f-9f1a-29ca77119274'
  ),
  midjourney: image(
    'https://cdn.acedata.cloud/uploads/d5d1566f-893c-4dac-bf3d-3b181b7e8ab3',
    'https://cdn.acedata.cloud/uploads/21379382-9aef-4597-8d6f-6bad33375943'
  ),
  nanobanana: image(
    'https://cdn.acedata.cloud/uploads/089b6deb-1ff1-4cf5-b938-36a2493a40da',
    'https://cdn.acedata.cloud/uploads/165db012-430e-455c-844e-cd88bc88f60c'
  ),
  seedream: image(
    'https://cdn.acedata.cloud/uploads/7e45490e-8b41-48e9-9d31-dfae7072a7fa',
    'https://cdn.acedata.cloud/uploads/91c96b92-31ff-4e99-bdd7-5314d1781246'
  ),
  flux: image(
    'https://cdn.acedata.cloud/uploads/7f7caa8d-5d61-4c03-9b14-14ddc865be5a',
    'https://cdn.acedata.cloud/uploads/63e300df-a3c1-43c7-b170-6fd3fdfe15b5'
  ),
  suno: image(
    'https://cdn.acedata.cloud/uploads/5ab7f19e-2047-4c62-a228-ae4170ca58b0',
    'https://cdn.acedata.cloud/uploads/6e962c96-1b2c-4e17-a791-e1c4a7929ba3'
  ),
  fish: image(
    'https://cdn.acedata.cloud/uploads/db375091-7ddc-4d36-a4f8-db13fe1df424',
    'https://cdn.acedata.cloud/uploads/d50b6bcd-e6a3-4863-a964-c68f259c4ae0'
  ),
  kling: image(
    'https://cdn.acedata.cloud/uploads/fd38b6c8-9794-4414-884c-9ca9619c7da6',
    'https://cdn.acedata.cloud/uploads/3531e27b-58d8-4c65-9010-148b7c785560'
  ),
  veo: image(
    'https://cdn.acedata.cloud/uploads/e8291d40-e2d1-465e-88b6-3febbbba9a9b',
    'https://cdn.acedata.cloud/uploads/efc32760-db07-439d-beff-ceaef735c3b4'
  ),
  seedance: image(
    'https://cdn.acedata.cloud/uploads/26a91d87-e267-4e39-9bbd-a2c5c8ec0cdc',
    'https://cdn.acedata.cloud/uploads/8fd9cdc3-41f8-4d2f-9f32-60d083683307'
  ),
  maestro: image(
    'https://cdn.acedata.cloud/uploads/e20d1a42-7824-4803-b6b6-8d121a7eb713',
    'https://cdn.acedata.cloud/uploads/3b6887f8-5be1-4a19-9fcc-45ec6d695af0'
  ),
  maestroNarrated: image('https://cdn.acedata.cloud/fb12495d70.jpg', 'https://cdn.acedata.cloud/fb12495d70.jpg'),
  maestroDrama: image('https://cdn.acedata.cloud/33b9189ad0.jpg', 'https://cdn.acedata.cloud/33b9189ad0.jpg'),
  maestroAvatar: image('https://cdn.acedata.cloud/540bda9cb6.jpg', 'https://cdn.acedata.cloud/540bda9cb6.jpg'),
  maestroCaptions: image('https://cdn.acedata.cloud/e86fddfc71.jpg', 'https://cdn.acedata.cloud/e86fddfc71.jpg'),
  digitalHuman: image(
    'https://cdn.acedata.cloud/uploads/3a49d5fa-cd7a-4fb6-a6c0-e4f0a6d56d4d',
    'https://cdn.acedata.cloud/uploads/b2ce6c5c-56d3-45e7-9d9e-598b5dfd9ae4'
  ),
  serp: image(
    'https://cdn.acedata.cloud/uploads/8ccda980-60e5-4db7-9d99-66628ced5c44',
    'https://cdn.acedata.cloud/uploads/94c23b79-4af7-4afd-9deb-1ac760e01950'
  ),
  webextrator: image(
    'https://cdn.acedata.cloud/uploads/e1b19df4-1720-4674-abdd-9db0f7f529b2',
    'https://cdn.acedata.cloud/uploads/6c9e4c43-d0bc-4a63-ba9e-4e9fbbd6b245'
  ),
  codingBridge: image(
    'https://cdn.acedata.cloud/uploads/ef0be118-adfa-4814-b672-a6977915e7f0',
    'https://cdn.acedata.cloud/uploads/97d60828-c1c1-4ebb-a219-30bbed1e6353'
  )
};

export interface IHomeDestination {
  capability: CapabilityKey;
  path: string;
  defaultName: string;
  descriptionKey: string;
}

export interface IHomeBanner extends IHomeDestination {
  id: string;
  eyebrowKey: string;
  titleKey: string;
  image: ILocalizedImage;
  focalPoint?: string;
}

export interface IQuickCreate {
  id: string;
  titleKey: string;
  descriptionKey: string;
  destinations: IHomeDestination[];
}

export interface IFeaturedCapability extends IHomeDestination {
  image?: ILocalizedImage;
  focalPoint?: string;
}

export interface IInspirationItem extends IHomeDestination {
  id: string;
  titleKey: string;
  image: ILocalizedImage;
  aspect: 'portrait' | 'landscape' | 'square' | 'wide';
  focalPoint?: string;
}

export interface IResolvedBanner {
  id: string;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  focalPoint?: string;
}

export interface IResolvedQuickCreate {
  id: string;
  path: string;
  title: string;
  description: string;
  icon: string;
}

export interface IResolvedCapability {
  capability: CapabilityKey;
  path: string;
  name: string;
  description: string;
  icon: string;
  defaultIcon: string;
  image?: string;
  focalPoint?: string;
}

export interface IResolvedInspiration extends IResolvedCapability {
  id: string;
  title: string;
  aspect: IInspirationItem['aspect'];
  image: string;
}

const destination = (
  capability: CapabilityKey,
  path: string,
  defaultName: string,
  descriptionKey: string
): IHomeDestination => ({ capability, path, defaultName, descriptionKey });

const CHAT = destination('chatgpt', '/chatgpt', 'ChatGPT', 'intro.model.chatgpt');
const IMAGE = destination('openaiimage', '/openaiimage', 'GPT Image', 'intro.model.gptimage');
const NANO = destination('nanobanana', '/nanobanana', 'Nano Banana', 'intro.model.nanobanana');
const SEEDREAM = destination('seedream', '/seedream', 'Seedream', 'intro.model.seedream');
const VIDEO = destination('seedance', '/seedance', 'Seedance', 'intro.model.seedance');
const KLING = destination('kling', '/kling', 'Kling', 'intro.model.kling');
const VEO = destination('veo', '/veo', 'Veo', 'intro.model.veo');
const MUSIC = destination('suno', '/suno', 'Suno', 'intro.model.suno');
const MAESTRO = destination('maestro', '/maestro', 'Maestro', 'intro.model.maestro');
const CODING = destination('codingBridge', '/coding-bridge', 'Coding Bridge', 'intro.model.codingbridge');

export const HOME_BANNERS: IHomeBanner[] = [
  {
    ...MAESTRO,
    id: 'production',
    eyebrowKey: 'intro.home.banner.production.eyebrow',
    titleKey: 'intro.home.banner.production.title',
    descriptionKey: 'intro.home.banner.production.description',
    image: HOME_SHOTS.maestroNarrated,
    focalPoint: 'center 58%'
  },
  {
    ...VIDEO,
    id: 'video',
    eyebrowKey: 'intro.home.banner.video.eyebrow',
    titleKey: 'intro.home.banner.video.title',
    descriptionKey: 'intro.home.banner.video.description',
    image: HOME_SHOTS.seedance,
    focalPoint: 'center 35%'
  },
  {
    ...NANO,
    id: 'image',
    eyebrowKey: 'intro.home.banner.image.eyebrow',
    titleKey: 'intro.home.banner.image.title',
    descriptionKey: 'intro.home.banner.image.description',
    image: HOME_SHOTS.nanobanana,
    focalPoint: 'center 45%'
  }
];

export const QUICK_CREATE: IQuickCreate[] = [
  {
    id: 'chat',
    titleKey: 'intro.home.quick.chat.title',
    descriptionKey: 'intro.home.quick.chat.description',
    destinations: [CHAT, destination('claude', '/claude', 'Claude', 'intro.model.claude')]
  },
  {
    id: 'image',
    titleKey: 'intro.home.quick.image.title',
    descriptionKey: 'intro.home.quick.image.description',
    destinations: [
      IMAGE,
      NANO,
      SEEDREAM,
      destination('midjourney', '/midjourney', 'Midjourney', 'intro.model.midjourney')
    ]
  },
  {
    id: 'video',
    titleKey: 'intro.home.quick.video.title',
    descriptionKey: 'intro.home.quick.video.description',
    destinations: [VIDEO, KLING, VEO, destination('minimax', '/minimax', 'MiniMax H3', 'intro.model.minimax')]
  },
  {
    id: 'music',
    titleKey: 'intro.home.quick.music.title',
    descriptionKey: 'intro.home.quick.music.description',
    destinations: [MUSIC, destination('producer', '/producer', 'Producer', 'intro.model.producer')]
  },
  {
    id: 'production',
    titleKey: 'intro.home.quick.production.title',
    descriptionKey: 'intro.home.quick.production.description',
    destinations: [MAESTRO, destination('digitalhuman', '/digital-human', 'Digital Human', 'intro.model.digitalhuman')]
  },
  {
    id: 'coding',
    titleKey: 'intro.home.quick.coding.title',
    descriptionKey: 'intro.home.quick.coding.description',
    destinations: [CODING]
  }
];

export const FEATURED_CAPABILITIES: IFeaturedCapability[] = [
  { ...NANO, image: HOME_SHOTS.nanobanana, focalPoint: 'center 40%' },
  { ...VIDEO, image: HOME_SHOTS.seedance, focalPoint: 'center 38%' },
  { ...MAESTRO, image: HOME_SHOTS.maestroDrama, focalPoint: 'center 35%' },
  { ...MUSIC, image: HOME_SHOTS.suno, focalPoint: 'center 35%' },
  { ...IMAGE, image: HOME_SHOTS.seedream, focalPoint: 'center 36%' },
  { ...KLING, image: HOME_SHOTS.kling, focalPoint: 'center 35%' },
  { ...CODING, image: HOME_SHOTS.codingBridge, focalPoint: 'center 32%' },
  destination('qrart', '/qrart', 'QR Art', 'intro.model.qrart'),
  destination('pika', '/pika', 'Pika', 'intro.model.pika'),
  destination('minimax', '/minimax', 'MiniMax H3', 'intro.model.minimax')
];

export const INSPIRATION_ITEMS: IInspirationItem[] = [
  {
    ...NANO,
    id: 'portrait-edit',
    titleKey: 'intro.home.inspiration.portrait',
    image: HOME_SHOTS.nanobanana,
    aspect: 'portrait',
    focalPoint: 'center 42%'
  },
  {
    ...VIDEO,
    id: 'cinematic-motion',
    titleKey: 'intro.home.inspiration.cinematic',
    image: HOME_SHOTS.seedance,
    aspect: 'wide',
    focalPoint: 'center 34%'
  },
  {
    ...SEEDREAM,
    id: 'visual-story',
    titleKey: 'intro.home.inspiration.story',
    image: HOME_SHOTS.seedream,
    aspect: 'square',
    focalPoint: 'center 35%'
  },
  {
    ...MUSIC,
    id: 'original-song',
    titleKey: 'intro.home.inspiration.song',
    image: HOME_SHOTS.suno,
    aspect: 'landscape',
    focalPoint: 'center 36%'
  },
  {
    ...MAESTRO,
    id: 'article-video',
    titleKey: 'intro.home.inspiration.article',
    image: HOME_SHOTS.maestroNarrated,
    aspect: 'wide',
    focalPoint: 'center 62%'
  },
  {
    ...MAESTRO,
    id: 'short-drama',
    titleKey: 'intro.home.inspiration.character',
    image: HOME_SHOTS.maestroDrama,
    aspect: 'portrait',
    focalPoint: 'center 35%'
  },
  {
    ...KLING,
    id: 'character-motion',
    titleKey: 'intro.home.inspiration.character',
    image: HOME_SHOTS.kling,
    aspect: 'portrait',
    focalPoint: 'center 35%'
  },
  {
    ...VEO,
    id: 'cinematic-scene',
    titleKey: 'intro.home.inspiration.scene',
    image: HOME_SHOTS.veo,
    aspect: 'landscape',
    focalPoint: 'center 34%'
  },
  {
    ...CODING,
    id: 'agent-workspace',
    titleKey: 'intro.home.inspiration.agent',
    image: HOME_SHOTS.codingBridge,
    aspect: 'square',
    focalPoint: 'center 32%'
  }
];
