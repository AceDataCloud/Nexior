import type { CapabilityKey } from '@/constants/capabilities';
import {
  ROUTE_CHATGPT_CONVERSATION_NEW,
  ROUTE_CLAUDE_CONVERSATION_NEW,
  ROUTE_DEEPSEEK_CONVERSATION_NEW,
  ROUTE_FISH_TTS_INDEX,
  ROUTE_GEMINI_CONVERSATION_NEW,
  ROUTE_GROK_CONVERSATION_NEW,
  ROUTE_GROKVIDEO_INDEX,
  ROUTE_KLING_INDEX,
  ROUTE_MAESTRO_INDEX,
  ROUTE_NANOBANANA_INDEX,
  ROUTE_OPENAIIMAGE_INDEX,
  ROUTE_PRODUCER_INDEX,
  ROUTE_SEEDANCE_INDEX,
  ROUTE_SEEDREAM_INDEX,
  ROUTE_SUNO_INDEX,
  ROUTE_VEO_INDEX
} from '@/router/constants';

export interface HomeCapability {
  capability: CapabilityKey;
  routeName: string;
  defaultName: string;
  descriptionKey: string;
  imageUrl: string;
  focalPoint?: string;
}

export interface HomeBanner extends HomeCapability {
  id: string;
  eyebrowKey: string;
  titleKey: string;
}

export interface HomeCategory {
  id: string;
  titleKey: string;
  descriptionKey: string;
  imageUrl: string;
  focalPoint?: string;
  candidates: HomeCapability[];
}

export type HomeBannerTarget = { routeName: string } | { href: string } | null;

export interface ResolvedHomeCapability {
  capability: CapabilityKey;
  routeName: string;
  name: string;
  description: string;
  icon: string;
  defaultIcon: string;
  imageUrl: string;
  focalPoint?: string;
}

export interface ResolvedHomeBanner {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultIcon: string;
  imageUrl: string;
  focalPoint?: string;
  eyebrow: string;
  title: string;
  target: HomeBannerTarget;
}

export interface ResolvedHomeCategory {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  focalPoint?: string;
  items: ResolvedHomeCapability[];
}

const capability = (
  key: CapabilityKey,
  routeName: string,
  defaultName: string,
  descriptionKey: string,
  imageUrl: string,
  focalPoint = 'center'
): HomeCapability => ({ capability: key, routeName, defaultName, descriptionKey, imageUrl, focalPoint });

export const HOME_BANNERS: HomeBanner[] = [
  {
    ...capability(
      'maestro',
      ROUTE_MAESTRO_INDEX,
      'Maestro',
      'intro.home.banner.production.description',
      'https://cdn.acedata.cloud/uploads/dc6b73ba-1918-4ab5-a8f5-c51d6ac018a6',
      'center 42%'
    ),
    id: 'maestro',
    eyebrowKey: 'intro.home.banner.production.eyebrow',
    titleKey: 'intro.home.banner.production.title'
  },
  {
    ...capability(
      'openaiimage',
      ROUTE_OPENAIIMAGE_INDEX,
      'GPT Image',
      'intro.home.banner.image.description',
      'https://cdn.acedata.cloud/uploads/230806e5-8c76-4bdb-b0a2-99edafdf3e3c',
      'center 48%'
    ),
    id: 'gpt-image',
    eyebrowKey: 'intro.home.banner.image.eyebrow',
    titleKey: 'intro.home.banner.image.title'
  },
  {
    ...capability(
      'seedance',
      ROUTE_SEEDANCE_INDEX,
      'Seedance',
      'intro.home.banner.video.description',
      'https://cdn.acedata.cloud/uploads/92827ea5-acde-485a-9c0d-8f23d9503a24',
      'center 35%'
    ),
    id: 'seedance',
    eyebrowKey: 'intro.home.banner.video.eyebrow',
    titleKey: 'intro.home.banner.video.title'
  }
];

export const HOME_CATEGORIES: HomeCategory[] = [
  {
    id: 'chat',
    titleKey: 'intro.home.quick.chat.title',
    descriptionKey: 'intro.home.quick.chat.description',
    imageUrl: 'https://cdn.acedata.cloud/uploads/8eee5453-4ac1-411f-8ae5-4308dee9340f',
    focalPoint: 'center 44%',
    candidates: [
      capability('chatgpt', ROUTE_CHATGPT_CONVERSATION_NEW, 'ChatGPT', 'intro.model.chatgpt', ''),
      capability('claude', ROUTE_CLAUDE_CONVERSATION_NEW, 'Claude', 'intro.model.claude', ''),
      capability('gemini', ROUTE_GEMINI_CONVERSATION_NEW, 'Gemini', 'intro.model.gemini', ''),
      capability('grok', ROUTE_GROK_CONVERSATION_NEW, 'Grok', 'intro.model.grok', ''),
      capability('deepseek', ROUTE_DEEPSEEK_CONVERSATION_NEW, 'DeepSeek', 'intro.model.deepseek', '')
    ]
  },
  {
    id: 'image',
    titleKey: 'intro.home.quick.image.title',
    descriptionKey: 'intro.home.quick.image.description',
    imageUrl: 'https://cdn.acedata.cloud/uploads/e9f7075c-33b1-4528-94c5-4b6ed1918db4',
    focalPoint: 'center 48%',
    candidates: [
      capability('nanobanana', ROUTE_NANOBANANA_INDEX, 'Nano Banana', 'intro.model.nanobanana', ''),
      capability('openaiimage', ROUTE_OPENAIIMAGE_INDEX, 'GPT Image', 'intro.model.gptimage', ''),
      capability('seedream', ROUTE_SEEDREAM_INDEX, 'Seedream', 'intro.model.seedream', '')
    ]
  },
  {
    id: 'video',
    titleKey: 'intro.home.quick.video.title',
    descriptionKey: 'intro.home.quick.video.description',
    imageUrl: 'https://cdn.acedata.cloud/uploads/136c26cf-4223-4109-b34e-cf0dded44ce5',
    focalPoint: 'center 48%',
    candidates: [
      capability('seedance', ROUTE_SEEDANCE_INDEX, 'Seedance', 'intro.model.seedance', ''),
      capability('kling', ROUTE_KLING_INDEX, 'Kling', 'intro.model.kling', ''),
      capability('veo', ROUTE_VEO_INDEX, 'Veo', 'intro.model.veo', ''),
      capability('grokvideo', ROUTE_GROKVIDEO_INDEX, 'Grok Imagine Video', 'intro.model.grokvideo', '')
    ]
  },
  {
    id: 'music',
    titleKey: 'intro.home.quick.music.title',
    descriptionKey: 'intro.home.quick.music.description',
    imageUrl: 'https://cdn.acedata.cloud/uploads/b36a3c50-b987-48de-b5bb-22ad4bedf78a',
    focalPoint: 'center 45%',
    candidates: [
      capability('suno', ROUTE_SUNO_INDEX, 'Suno', 'intro.model.suno', ''),
      capability('producer', ROUTE_PRODUCER_INDEX, 'Producer', 'intro.model.producer', ''),
      capability('fish', ROUTE_FISH_TTS_INDEX, 'Fish Audio', 'intro.model.fish', '')
    ]
  }
];

export const HOME_CAPABILITY_DEFINITIONS = new Map<CapabilityKey, HomeCapability>(
  HOME_CATEGORIES.flatMap((category) => category.candidates.map((item) => [item.capability, item] as const))
);

export const HOME_CAPABILITY_ROUTES = new Map<CapabilityKey, string>(
  [...HOME_CAPABILITY_DEFINITIONS].map(([key, item]) => [key, item.routeName])
);

export const HOME_CAPABILITY_KEYS = [
  ...HOME_BANNERS.map((item) => item.capability),
  ...HOME_CATEGORIES.flatMap((item) => item.candidates.map((candidate) => candidate.capability))
];
