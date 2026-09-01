import type { CapabilityKey } from '@/constants/capabilities';
import {
  MAESTRO_ALLOWED_ASPECTS,
  MAESTRO_ALLOWED_LANGS,
  MAESTRO_ALLOWED_SCENARIOS,
  MAESTRO_ALLOWED_STYLES,
  MAESTRO_ALLOWED_VOICES,
  MAESTRO_FILE_LIMIT
} from '@/constants';
import type { IShowcase, ISite } from '@/models';
import { showcaseOperator } from '@/operators';
import { SHOWCASE_CAPABILITIES } from './showcase';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { Store } from 'vuex';

const CDN_HOSTS = new Set(['cdn.acedata.cloud', 'platform2.cdn.acedata.cloud']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TEXT = 8000;

type Translator = (key: string, params?: Record<string, unknown>) => string;
type Config = Record<string, unknown>;

interface Adapter {
  allowed: Set<string>;
  build(config: Config): Config;
  activeKeys: string[];
  commits?: Array<{ type: string; payload: unknown }>;
}

export interface ConsumeShowcaseOptions {
  capability: CapabilityKey;
  route: RouteLocationNormalizedLoaded;
  router: Router;
  store: Store<any>;
  site: ISite | undefined;
  locale: string;
  t: Translator;
}

export type ConsumeShowcaseResult = 'absent' | 'applied' | 'cancelled' | 'invalid' | 'failed';

function text(value: unknown, field: string, maximum = MAX_TEXT): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > maximum) throw new Error(`${field} is invalid`);
  return value;
}

function boolean(value: unknown, field: string): boolean | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'boolean') throw new Error(`${field} is invalid`);
  return value;
}

function number(value: unknown, field: string, minimum: number, maximum: number): number | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum)
    throw new Error(`${field} is invalid`);
  return value;
}

function enumValue(value: unknown, field: string, allowed: string[]): string | undefined {
  const parsed = text(value, field, 100);
  if (parsed == null) return undefined;
  if (!allowed.includes(parsed)) throw new Error(`${field} is invalid`);
  return parsed;
}

function cdnUrl(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`${field} is invalid`);
  const parsed = new URL(value);
  if (
    parsed.protocol !== 'https:' ||
    !CDN_HOSTS.has(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  )
    throw new Error(`${field} is invalid`);
  return value;
}

function urls(value: unknown, field: string): string[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > 8) throw new Error(`${field} is invalid`);
  return value.map((item, index) => cdnUrl(item, `${field}[${index}]`));
}

function compact(config: Config): Config {
  return Object.fromEntries(Object.entries(config).filter(([, value]) => value !== undefined));
}

const imageAllowed = new Set([
  'prompt',
  'model',
  'images',
  'aspect_ratio',
  'size',
  'resolution',
  'seed',
  'max_images',
  'guidance_scale',
  'output_format'
]);
const nanoBananaAllowed = new Set([...imageAllowed, 'action']);
const seedreamAllowed = new Set([...imageAllowed, 'watermark']);
const videoAllowed = new Set([
  'prompt',
  'negative_prompt',
  'model',
  'images',
  'start_image_url',
  'end_image_url',
  'aspect_ratio',
  'ratio',
  'duration',
  'resolution',
  'mode',
  'seed',
  'camerafixed',
  'generate_audio',
  'return_last_frame',
  'translation',
  'cfg_scale'
]);
const musicAllowed = new Set(['action', 'prompt', 'lyric', 'style', 'title', 'instrumental', 'custom', 'model']);
const maestroAllowed = new Set([
  'action',
  'prompt',
  'file_urls',
  'langs',
  'aspect',
  'duration',
  'quality', // accepted from historical showcases but intentionally not replayed
  'scenario',
  'style',
  'voice'
]);

const adapters: Partial<Record<CapabilityKey, Adapter>> = {
  nanobanana: {
    allowed: nanoBananaAllowed,
    activeKeys: ['prompt', 'image_urls'],
    build: (c) =>
      compact({
        prompt: text(c.prompt, 'prompt'),
        model: text(c.model, 'model', 100),
        image_urls: urls(c.images, 'images'),
        aspect_ratio: enumValue(c.aspect_ratio, 'aspect_ratio', [
          'auto',
          '1:1',
          '2:3',
          '3:2',
          '3:4',
          '4:3',
          '4:5',
          '5:4',
          '9:16',
          '16:9',
          '21:9'
        ]),
        resolution: text(c.resolution, 'resolution', 32)
      })
  },
  openaiimage: {
    allowed: imageAllowed,
    activeKeys: ['prompt', 'image_urls'],
    build: (c) =>
      compact({
        prompt: text(c.prompt, 'prompt'),
        model: text(c.model, 'model', 100),
        image_urls: urls(c.images, 'images'),
        size: text(c.size, 'size', 32)
      })
  },
  seedream: {
    allowed: seedreamAllowed,
    activeKeys: ['prompt', 'image'],
    build: (c) =>
      compact({
        action: 'generate',
        prompt: text(c.prompt, 'prompt'),
        model: text(c.model, 'model', 100),
        image: urls(c.images, 'images'),
        size: text(c.size, 'size', 32),
        seed: number(c.seed, 'seed', 0, 2147483647),
        sequential_image_generation_options:
          c.max_images == null ? undefined : { max_images: number(c.max_images, 'max_images', 1, 15) },
        guidance_scale: number(c.guidance_scale, 'guidance_scale', 0, 20),
        output_format: enumValue(c.output_format, 'output_format', ['jpeg', 'png'])
      })
  },
  seedance: {
    allowed: videoAllowed,
    activeKeys: ['prompt', 'images', 'audios', 'videos'],
    build: (c) =>
      compact({
        prompt: text(c.prompt, 'prompt'),
        model: text(c.model, 'model', 100),
        images: urls(c.images, 'images')?.map((url) => ({ url, role: 'reference_image' })),
        ratio: enumValue(c.ratio, 'ratio', ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive']),
        duration: number(c.duration, 'duration', 1, 30),
        resolution: enumValue(c.resolution, 'resolution', ['480p', '720p', '1080p', '4k']),
        seed: number(c.seed, 'seed', 0, 4294967295),
        camerafixed: boolean(c.camerafixed, 'camerafixed'),
        generate_audio: boolean(c.generate_audio, 'generate_audio'),
        return_last_frame: boolean(c.return_last_frame, 'return_last_frame')
      })
  },
  kling: {
    allowed: videoAllowed,
    activeKeys: ['prompt', 'start_image_url', 'end_image_url'],
    commits: [{ type: 'kling/setTaskType', payload: 'videos' }],
    build: (c) =>
      compact({
        action: 'generate',
        prompt: text(c.prompt, 'prompt'),
        negative_prompt: text(c.negative_prompt, 'negative_prompt'),
        model: text(c.model, 'model', 100),
        mode: enumValue(c.mode, 'mode', ['std', 'pro']),
        start_image_url: c.start_image_url == null ? undefined : cdnUrl(c.start_image_url, 'start_image_url'),
        end_image_url: c.end_image_url == null ? undefined : cdnUrl(c.end_image_url, 'end_image_url'),
        aspect_ratio: enumValue(c.aspect_ratio, 'aspect_ratio', ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9']),
        duration: number(c.duration, 'duration', 1, 30),
        cfg_scale: number(c.cfg_scale, 'cfg_scale', 0, 1),
        generate_audio: boolean(c.generate_audio, 'generate_audio')
      })
  },
  veo: {
    allowed: videoAllowed,
    activeKeys: ['prompt', 'image_urls'],
    build: (c) => {
      const imageUrls = urls(c.images, 'images');
      return compact({
        action: imageUrls?.length ? 'image2video' : 'text2video',
        prompt: text(c.prompt, 'prompt'),
        model: text(c.model, 'model', 100),
        image_urls: imageUrls,
        aspect_ratio: enumValue(c.aspect_ratio, 'aspect_ratio', ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9']),
        translation: boolean(c.translation, 'translation')
      });
    }
  },
  grokvideo: {
    allowed: videoAllowed,
    activeKeys: ['prompt', 'image_url', 'reference_image_urls'],
    build: (c) => {
      const media = urls(c.images, 'images');
      return compact({
        prompt: text(c.prompt, 'prompt'),
        model: text(c.model, 'model', 100),
        image_url: media?.[0],
        reference_image_urls: media?.slice(1),
        aspect_ratio: enumValue(c.aspect_ratio, 'aspect_ratio', ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3']),
        resolution: enumValue(c.resolution, 'resolution', ['480p', '720p', '1080p']),
        duration: number(c.duration, 'duration', 1, 30)
      });
    }
  },
  suno: {
    allowed: musicAllowed,
    activeKeys: ['prompt', 'lyric', 'style', 'title', 'audio', 'audio_id'],
    build: (c) =>
      compact({
        action: 'generate',
        prompt: text(c.prompt, 'prompt'),
        lyric: text(c.lyric, 'lyric'),
        style: text(c.style, 'style', 1000),
        title: text(c.title, 'title', 200),
        instrumental: boolean(c.instrumental, 'instrumental'),
        custom: boolean(c.custom, 'custom'),
        model: text(c.model, 'model', 100),
        continue_at: 0
      })
  },
  producer: {
    allowed: musicAllowed,
    activeKeys: ['prompt', 'lyric', 'style', 'title', 'audio', 'audio_id'],
    build: (c) =>
      compact({
        action: 'generate',
        prompt: text(c.prompt, 'prompt'),
        lyric: text(c.lyric, 'lyric'),
        style: text(c.style, 'style', 1000),
        title: text(c.title, 'title', 200),
        instrumental: boolean(c.instrumental, 'instrumental'),
        custom: boolean(c.custom, 'custom'),
        model: text(c.model, 'model', 100),
        continue_at: 0
      })
  },

  maestro: {
    allowed: maestroAllowed,
    activeKeys: ['prompt', 'file_urls'],
    build: (c) => {
      if (c.action !== 'generate') throw new Error('action is invalid');
      const langs = c.langs;
      if (
        !Array.isArray(langs) ||
        !langs.length ||
        langs.length > 4 ||
        new Set(langs).size !== langs.length ||
        !langs.every((lang) => typeof lang === 'string' && MAESTRO_ALLOWED_LANGS.includes(lang))
      )
        throw new Error('langs is invalid');
      const scenario = enumValue(c.scenario, 'scenario', ['auto', ...MAESTRO_ALLOWED_SCENARIOS]);
      if (!scenario) throw new Error('scenario is invalid');
      const fileUrls = c.file_urls == null ? [] : urls(c.file_urls, 'file_urls');
      if (!fileUrls || fileUrls.length > MAESTRO_FILE_LIMIT) throw new Error('file_urls is invalid');
      const paths = fileUrls.map((url) => new URL(url).pathname.toLowerCase());
      if (scenario === 'avatar' && !paths.some((path) => /\.(png|jpe?g|webp)$/.test(path)))
        throw new Error('avatar source is invalid');
      if (scenario === 'captions' && !paths.some((path) => /\.(mp4|mov|webm)$/.test(path)))
        throw new Error('captions source is invalid');
      const prompt = text(c.prompt, 'prompt');
      if (!prompt?.trim()) throw new Error('prompt is invalid');
      const aspect = enumValue(c.aspect, 'aspect', MAESTRO_ALLOWED_ASPECTS);
      if (!aspect) throw new Error('aspect is invalid');
      const duration = number(c.duration, 'duration', 5, 300);
      if (duration == null || !Number.isInteger(duration)) throw new Error('duration is invalid');
      const style = enumValue(c.style, 'style', MAESTRO_ALLOWED_STYLES);
      if (!style) throw new Error('style is invalid');
      const voice = enumValue(
        c.voice,
        'voice',
        MAESTRO_ALLOWED_VOICES.map((option) => option.key)
      );
      if (!voice) throw new Error('voice is invalid');
      return compact({
        action: 'generate',
        prompt,
        file_urls: fileUrls,
        langs: [...langs],
        aspect,
        duration,
        scenario_customization_enabled: scenario !== 'auto',
        style_customization_enabled: true,
        voice_customization_enabled: true,
        scenario: scenario === 'auto' ? undefined : scenario,
        style,
        voice
      });
    }
  },
  fish: {
    allowed: new Set(['text', 'voice_id', 'model', 'format', 'speed', 'volume']),
    activeKeys: ['text', 'reference_id'],
    build: (c) =>
      compact({
        text: text(c.text, 'text'),
        reference_id: text(c.voice_id, 'voice_id', 255),
        model: text(c.model, 'model', 100),
        format: enumValue(c.format, 'format', ['mp3', 'wav', 'pcm', 'opus']),
        prosody:
          c.speed == null && c.volume == null
            ? undefined
            : compact({
                speed: number(c.speed, 'speed', 0.5, 2),
                volume: number(c.volume, 'volume', -20, 20)
              })
      })
  }
};

function hasActiveInput(config: Config | undefined, keys: string[]): boolean {
  if (!config) return false;
  return keys.some((key) => {
    const value = config[key];
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  });
}

function validateItem(
  item: IShowcase,
  capability: CapabilityKey,
  service: string
): { adapter: Adapter; patch: Config } {
  if (item.service !== service) throw new Error('unsupported showcase');
  const adapter = adapters[capability];
  if (!adapter) throw new Error('unsupported capability');
  const request = item.data?.request;
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('invalid config');
  const unknown = Object.keys(request).filter((key) => !adapter.allowed.has(key));
  if (unknown.length) throw new Error('unsupported fields');
  if (adapter.allowed === nanoBananaAllowed && 'action' in request && request.action !== 'generate')
    throw new Error('unsupported action');
  if (capability === 'seedream' && 'watermark' in request && request.watermark !== false)
    throw new Error('unsupported watermark');
  if ((capability === 'suno' || capability === 'producer') && 'action' in request && request.action !== 'generate')
    throw new Error('unsupported action');
  return { adapter, patch: adapter.build(request) };
}

async function stripShowcaseQuery(route: RouteLocationNormalizedLoaded, router: Router): Promise<void> {
  const query = { ...route.query };
  delete query.showcase;
  await router.replace({ path: route.path, query, hash: route.hash });
}

export async function consumeShowcase(options: ConsumeShowcaseOptions): Promise<ConsumeShowcaseResult> {
  const raw = options.route.query.showcase;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || typeof id !== 'string') return 'absent';
  if (!UUID_RE.test(id)) {
    await stripShowcaseQuery(options.route, options.router);
    ElMessage.warning(options.t('intro.home.showcase.unavailable'));
    return 'invalid';
  }

  try {
    const definition = SHOWCASE_CAPABILITIES.get(options.capability);
    if (!definition || !options.site?.features?.[options.capability]?.enabled) throw new Error('disabled capability');
    const response = await showcaseOperator.list(definition.service, options.locale);
    const item = response.data.find((candidate) => candidate.id === id);
    if (!item) throw new Error('showcase not found');
    const { adapter, patch } = validateItem(item, options.capability, definition.service);
    const current = options.store.state[options.capability]?.config as Config | undefined;
    const replacingActiveInput = hasActiveInput(current, adapter.activeKeys);
    if (replacingActiveInput) {
      try {
        await ElMessageBox.confirm(
          options.t('intro.home.showcase.replaceMessage'),
          options.t('intro.home.showcase.replaceTitle'),
          {
            confirmButtonText: options.t('intro.home.showcase.replace'),
            cancelButtonText: options.t('intro.home.showcase.cancel'),
            type: 'warning'
          }
        );
      } catch {
        await stripShowcaseQuery(options.route, options.router);
        return 'cancelled';
      }
    }
    for (const commit of adapter.commits || []) options.store.commit(commit.type, commit.payload);
    options.store.commit(
      `${options.capability}/setConfig`,
      replacingActiveInput ? patch : { ...(current || {}), ...patch }
    );
    await stripShowcaseQuery(options.route, options.router);
    return 'applied';
  } catch {
    await stripShowcaseQuery(options.route, options.router);
    ElMessage.warning(options.t('intro.home.showcase.unavailable'));
    return 'failed';
  }
}

export const SHOWCASE_RECREATE_CAPABILITIES = new Set(Object.keys(adapters) as CapabilityKey[]);
