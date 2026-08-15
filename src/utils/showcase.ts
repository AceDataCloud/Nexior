import { CAPABILITY_ICONS, type CapabilityKey } from '@/constants/capabilities';
import type { IShowcase, ISite, ResolvedShowcase, ShowcaseLayout, ShowcaseMediaType } from '@/models';
import {
  ROUTE_FISH_TTS_INDEX,
  ROUTE_GROKVIDEO_INDEX,
  ROUTE_KLING_INDEX,
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

function deriveMedia(
  type: unknown,
  result: Record<string, unknown>
): {
  mediaType: ShowcaseMediaType;
  posterUrl: string;
  previewUrl: string;
  layout: ShowcaseLayout;
} {
  if (type === 'videos' || result.video_url) {
    return {
      mediaType: 'Video',
      posterUrl: stringValue(result.last_frame_url, result.cover_url),
      previewUrl: stringValue(result.video_url),
      layout: 'Landscape'
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
    layout: 'Square'
  };
}

export function resolveShowcase(item: IShowcase, site: ISite, _locale: string): ResolvedShowcase | undefined {
  const definition = SHOWCASE_SERVICES.get(item.service);
  if (!definition || !site.features?.[definition.capability]?.enabled) return undefined;
  const request = objectValue(item.data.request);
  const response = objectValue(item.data.response);
  const result = firstResult(response);
  const media = deriveMedia(item.data.type, result);
  if (!media.posterUrl) return undefined;
  const defaultIcon = CAPABILITY_ICONS[definition.capability];
  const presentation = resolveCapabilityPresentation(site, definition.capability, definition.defaultName, defaultIcon);
  const prompt = stringValue(request.prompt, request.text);
  const title = stringValue(result.title, presentation.displayName);
  return {
    id: item.id,
    service: item.service,
    capability: definition.capability,
    routeName: definition.routeName,
    name: presentation.displayName,
    description: prompt,
    icon: presentation.iconUrl,
    defaultIcon,
    title,
    altText: title || prompt || presentation.displayName,
    ...media
  };
}
