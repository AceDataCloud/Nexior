import { CAPABILITY_ICONS, type CapabilityKey } from '@/constants/capabilities';
import type { IShowcase, ISite, ResolvedShowcase, ShowcaseLayout, ShowcaseMediaType } from '@/models';
import {
  ROUTE_FISH_TTS_INDEX,
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
import { resolveCapabilityPresentation } from './capabilityPresentation';

export interface ShowcaseServiceDefinition {
  service: string;
  capability: CapabilityKey;
  routeName: string;
  defaultName: string;
  descriptionKey: string;
}

const definitions: ShowcaseServiceDefinition[] = [
  {
    service: 'nano-banana',
    capability: 'nanobanana',
    routeName: ROUTE_NANOBANANA_INDEX,
    defaultName: 'Nano Banana',
    descriptionKey: 'intro.model.nanobanana'
  },
  {
    service: 'openai',
    capability: 'openaiimage',
    routeName: ROUTE_OPENAIIMAGE_INDEX,
    defaultName: 'GPT Image',
    descriptionKey: 'intro.model.gptimage'
  },
  {
    service: 'seedream',
    capability: 'seedream',
    routeName: ROUTE_SEEDREAM_INDEX,
    defaultName: 'Seedream',
    descriptionKey: 'intro.model.seedream'
  },
  {
    service: 'seedance',
    capability: 'seedance',
    routeName: ROUTE_SEEDANCE_INDEX,
    defaultName: 'Seedance',
    descriptionKey: 'intro.model.seedance'
  },
  {
    service: 'kling',
    capability: 'kling',
    routeName: ROUTE_KLING_INDEX,
    defaultName: 'Kling',
    descriptionKey: 'intro.model.kling'
  },
  {
    service: 'veo',
    capability: 'veo',
    routeName: ROUTE_VEO_INDEX,
    defaultName: 'Veo',
    descriptionKey: 'intro.model.veo'
  },
  {
    service: 'grok',
    capability: 'grokvideo',
    routeName: ROUTE_GROKVIDEO_INDEX,
    defaultName: 'Grok Imagine Video',
    descriptionKey: 'intro.model.grokvideo'
  },
  {
    service: 'suno',
    capability: 'suno',
    routeName: ROUTE_SUNO_INDEX,
    defaultName: 'Suno',
    descriptionKey: 'intro.model.suno'
  },
  {
    service: 'producer',
    capability: 'producer',
    routeName: ROUTE_PRODUCER_INDEX,
    defaultName: 'Producer',
    descriptionKey: 'intro.model.producer'
  },
  {
    service: 'fish',
    capability: 'fish',
    routeName: ROUTE_FISH_TTS_INDEX,
    defaultName: 'Fish Audio',
    descriptionKey: 'intro.model.fish'
  },
  {
    service: 'maestro',
    capability: 'maestro',
    routeName: ROUTE_MAESTRO_INDEX,
    defaultName: 'Maestro',
    descriptionKey: 'intro.home.banner.production.description'
  }
];

export const SHOWCASE_SERVICES = new Map(definitions.map((definition) => [definition.service, definition]));
export const SHOWCASE_CAPABILITIES = new Map(definitions.map((definition) => [definition.capability, definition]));

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function firstResult(response: Record<string, unknown>): Record<string, unknown> {
  const data = response.data;
  if (Array.isArray(data)) return objectValue(data[0]);
  return objectValue(data);
}

function stringValue(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0) || '';
}

function deriveLayout(request: Record<string, unknown>): ShowcaseLayout {
  const ratio = stringValue(request.aspect_ratio, request.ratio, request.aspect);
  const size = stringValue(request.size);
  const match = ratio.match(/^(\d+):(\d+)$/) || size.match(/^(\d+)x(\d+)$/);
  if (!match) return 'Square';
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width > height * 1.15) return 'Landscape';
  if (height > width * 1.15) return 'Portrait';
  return 'Square';
}

const PARAMETER_KEYS = [
  'model',
  'size',
  'aspect_ratio',
  'ratio',
  'aspect',
  'resolution',
  'quality',
  'scenario',
  'voice',
  'langs',
  'duration',
  'output_format',
  'seed',
  'instrumental',
  'custom',
  'style'
];

function deriveParameters(request: Record<string, unknown>): Array<{ key: string; value: string }> {
  return PARAMETER_KEYS.flatMap((key) => {
    const value = request[key];
    if (value == null || value === '') return [];
    if (key === 'langs' && Array.isArray(value) && value.every((item) => typeof item === 'string'))
      return [{ key, value: value.join(', ') }];
    if (typeof value === 'object') return [];
    return [{ key, value: String(value) }];
  });
}

function deriveMedia(
  type: unknown,
  request: Record<string, unknown>,
  result: Record<string, unknown>
): {
  mediaType: ShowcaseMediaType;
  posterUrl: string;
  previewUrl: string;
  layout: ShowcaseLayout;
} {
  if (type === 'videos' || result.video_url) {
    const variants = Array.isArray(result.variants) ? result.variants.map(objectValue) : [];
    const layout = deriveLayout(request);
    return {
      mediaType: 'Video',
      posterUrl: stringValue(result.last_frame_url, result.cover_url),
      previewUrl: stringValue(result.video_url, variants[0]?.output_url),
      layout: layout === 'Square' && !request.aspect ? 'Landscape' : layout
    };
  }
  if (type === 'audios' || result.audio_url || result.file_url) {
    return {
      mediaType: 'Audio',
      posterUrl: stringValue(result.image_url, result.cover_url),
      previewUrl: stringValue(result.audio_url, result.file_url),
      layout: 'Square'
    };
  }
  return {
    mediaType: 'Image',
    posterUrl: stringValue(result.image_url, result.url),
    previewUrl: '',
    layout: deriveLayout(request)
  };
}

export function resolveShowcase(item: IShowcase, site: ISite): ResolvedShowcase | undefined {
  const definition = SHOWCASE_SERVICES.get(item.service);
  if (!definition || !site.features?.[definition.capability]?.enabled) return undefined;
  const request = objectValue(item.data.request);
  const response = objectValue(item.data.response);
  const result = firstResult(response);
  const media = deriveMedia(item.data.type, request, result);
  if (!media.posterUrl || (media.mediaType !== 'Image' && !media.previewUrl)) return undefined;
  const defaultIcon = CAPABILITY_ICONS[definition.capability];
  const capabilityPresentation = resolveCapabilityPresentation(
    site,
    definition.capability,
    definition.defaultName,
    defaultIcon
  );
  const localizedPresentation = objectValue(item.data.presentation);
  const canCreateSimilar = item.service !== 'maestro';
  const prompt = canCreateSimilar ? stringValue(request.prompt, request.text, request.lyric) : '';
  const title = stringValue(localizedPresentation.title, result.title, capabilityPresentation.displayName);
  const description = stringValue(localizedPresentation.description, prompt);
  return {
    id: item.id,
    service: item.service,
    capability: definition.capability,
    routeName: definition.routeName,
    name: capabilityPresentation.displayName,
    description,
    icon: capabilityPresentation.iconUrl,
    defaultIcon,
    title,
    altText: title || description || capabilityPresentation.displayName,
    prompt,
    model: canCreateSimilar ? stringValue(request.model, result.model) : '',
    parameters: canCreateSimilar ? deriveParameters(request) : [],
    ...media
  };
}
