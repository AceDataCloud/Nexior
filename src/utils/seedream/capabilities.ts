// Capability matrix for Seedream / SeedEdit image models.
//
// Single source of truth derived from the Volcengine Ark image-generation docs:
// https://www.volcengine.com/docs/82379/1541523
//
// Mirrors the pattern used by `utils/kling/capabilities.ts`. Used by the
// Seedream config UI to:
//   - decide which selectors are visible for the current model
//   - filter the set of valid `size` presets
//   - prompt the user before silently dropping config that is no longer
//     supported (image upload, custom seed, group generation, etc.)

import {
  SEEDREAM_GUIDANCE_SCALE_DEFAULTS,
  SEEDREAM_MODEL_3_0_T2I,
  SEEDREAM_MODEL_4_0,
  SEEDREAM_MODEL_4_5,
  SEEDREAM_MODEL_5_0,
  SEEDREAM_MODEL_SEEDEDIT_3_0_I2I,
  SEEDREAM_SIZE_1K,
  SEEDREAM_SIZE_2K,
  SEEDREAM_SIZE_3K,
  SEEDREAM_SIZE_4K
} from '@/constants';

export interface ISeedreamCapability {
  /** Accepts the `image` request parameter (reference / edit images). */
  image: boolean;
  /** `image` is *required* (image-to-image only). */
  imageRequired: boolean;
  /** Allowed tier presets. Empty array means the model only accepts an
   *  explicit `<W>x<H>` value. */
  sizeTiers: string[];
  /** Accepts the `adaptive` size value (matches the reference image ratio). */
  sizeAdaptive: boolean;
  /** Accepts `<W>x<H>` pixel-value sizes. (Always true at the moment, kept
   *  for symmetry with the other flags.) */
  sizePixel: boolean;
  /** Default `<W>x<H>` to seed when the model rejects every preset. */
  sizePixelDefault?: string;
  /** Supports `sequential_image_generation=auto` group generation. */
  groupGeneration: boolean;
  /** Supports the `seed` parameter. */
  seed: boolean;
  /** Supports the `guidance_scale` parameter. */
  guidanceScale: boolean;
  /** Default `guidance_scale` value, when supported. */
  guidanceScaleDefault?: number;
  /** Supports the `output_format` parameter (jpeg / png). */
  outputFormat: boolean;
  /** Supports the `tools=[{type:"web_search"}]` parameter. */
  tools: boolean;
}

const FALLBACK: ISeedreamCapability = {
  image: true,
  imageRequired: false,
  sizeTiers: [SEEDREAM_SIZE_1K, SEEDREAM_SIZE_2K, SEEDREAM_SIZE_3K, SEEDREAM_SIZE_4K],
  sizeAdaptive: true,
  sizePixel: true,
  sizePixelDefault: undefined,
  groupGeneration: false,
  seed: false,
  guidanceScale: false,
  outputFormat: false,
  tools: false
};

/** Return the support matrix for a given model. */
export function getSeedreamCapabilities(model?: string): ISeedreamCapability {
  switch (model) {
    case SEEDREAM_MODEL_5_0:
      // 5.0-lite: tier presets 2K/3K/4K (no 1K — min ~3.7M pixels).
      return {
        image: true,
        imageRequired: false,
        sizeTiers: [SEEDREAM_SIZE_2K, SEEDREAM_SIZE_3K, SEEDREAM_SIZE_4K],
        sizeAdaptive: true,
        sizePixel: true,
        groupGeneration: true,
        seed: false,
        guidanceScale: false,
        outputFormat: true,
        tools: true
      };
    case SEEDREAM_MODEL_4_5:
    case SEEDREAM_MODEL_4_0:
      // 4.5 / 4.0: tier presets 1K/2K/4K (no 3K).
      return {
        image: true,
        imageRequired: false,
        sizeTiers: [SEEDREAM_SIZE_1K, SEEDREAM_SIZE_2K, SEEDREAM_SIZE_4K],
        sizeAdaptive: true,
        sizePixel: true,
        groupGeneration: true,
        seed: false,
        guidanceScale: false,
        outputFormat: false,
        tools: false
      };
    case SEEDREAM_MODEL_3_0_T2I:
      // 3.0-t2i: text-to-image only, pixel-only sizes.
      return {
        image: false,
        imageRequired: false,
        sizeTiers: [],
        sizeAdaptive: false,
        sizePixel: true,
        sizePixelDefault: '1024x1024',
        groupGeneration: false,
        seed: true,
        guidanceScale: true,
        guidanceScaleDefault: SEEDREAM_GUIDANCE_SCALE_DEFAULTS[SEEDREAM_MODEL_3_0_T2I],
        outputFormat: false,
        tools: false
      };
    case SEEDREAM_MODEL_SEEDEDIT_3_0_I2I:
      // seededit-3.0-i2i: image-to-image only, pixel-only sizes.
      return {
        image: true,
        imageRequired: true,
        sizeTiers: [],
        sizeAdaptive: false,
        sizePixel: true,
        sizePixelDefault: '1024x1024',
        groupGeneration: false,
        seed: true,
        guidanceScale: true,
        guidanceScaleDefault: SEEDREAM_GUIDANCE_SCALE_DEFAULTS[SEEDREAM_MODEL_SEEDEDIT_3_0_I2I],
        outputFormat: false,
        tools: false
      };
    default:
      return FALLBACK;
  }
}

export type SeedreamConflictField =
  | 'image'
  | 'size'
  | 'sequential_image_generation'
  | 'seed'
  | 'guidance_scale'
  | 'output_format'
  | 'tools';

export interface ISeedreamConflict {
  field: SeedreamConflictField;
  /** i18n key for the user-facing label of the field. */
  i18nLabel: string;
}

const TIER_PRESETS = [SEEDREAM_SIZE_1K, SEEDREAM_SIZE_2K, SEEDREAM_SIZE_3K, SEEDREAM_SIZE_4K];

/**
 * Compute which currently-set config fields will be unsupported under the
 * proposed `next` change (typically a model switch).
 */
export function findSeedreamConflicts(
  config: Record<string, any> | undefined,
  next: { model?: string }
): ISeedreamConflict[] {
  if (!config) return [];
  const model = next.model ?? config.model;
  if (!model) return [];

  const caps = getSeedreamCapabilities(model);
  const conflicts: ISeedreamConflict[] = [];

  if (Array.isArray(config.image) && config.image.length > 0 && !caps.image) {
    conflicts.push({ field: 'image', i18nLabel: 'seedream.name.imageUrls' });
  }

  // Size: flag tier presets the new model rejects, and `adaptive` when the
  // new model is pixel-only. Free-form `<W>x<H>` is always accepted.
  const size = typeof config.size === 'string' ? config.size : undefined;
  if (size) {
    const upper = size.toUpperCase();
    if (TIER_PRESETS.includes(upper) && !caps.sizeTiers.includes(upper)) {
      conflicts.push({ field: 'size', i18nLabel: 'seedream.name.size' });
    } else if (size === 'adaptive' && !caps.sizeAdaptive) {
      conflicts.push({ field: 'size', i18nLabel: 'seedream.name.size' });
    }
  }

  if (config.sequential_image_generation === 'auto' && !caps.groupGeneration) {
    conflicts.push({ field: 'sequential_image_generation', i18nLabel: 'seedream.name.maxImages' });
  }

  if (config.seed !== undefined && config.seed !== null && !caps.seed) {
    conflicts.push({ field: 'seed', i18nLabel: 'seedream.name.seed' });
  }

  if (config.guidance_scale !== undefined && config.guidance_scale !== null && !caps.guidanceScale) {
    conflicts.push({ field: 'guidance_scale', i18nLabel: 'seedream.name.guidanceScale' });
  }

  if (config.output_format && !caps.outputFormat) {
    conflicts.push({ field: 'output_format', i18nLabel: 'seedream.name.outputFormat' });
  }

  if (Array.isArray(config.tools) && config.tools.length > 0 && !caps.tools) {
    conflicts.push({ field: 'tools', i18nLabel: 'seedream.name.tools' });
  }

  return conflicts;
}

/**
 * Apply conflict resolutions to a config object. Returns a new object with the
 * offending fields cleared (or, for `size` on pixel-only models, replaced with
 * the model's pixel default).
 */
export function clearSeedreamConflicts(
  config: Record<string, any>,
  conflicts: ISeedreamConflict[],
  next: { model?: string }
): Record<string, any> {
  const result = { ...config };
  const targetModel = next.model ?? config.model;
  const caps = getSeedreamCapabilities(targetModel);

  for (const c of conflicts) {
    switch (c.field) {
      case 'image':
        delete result.image;
        break;
      case 'size':
        // Replace with the model's pixel default if it has no tier presets,
        // otherwise drop the field and let SizeSelector seed a tier default.
        if (caps.sizePixelDefault) {
          result.size = caps.sizePixelDefault;
        } else {
          delete result.size;
        }
        break;
      case 'sequential_image_generation':
        result.sequential_image_generation = 'disabled';
        delete result.sequential_image_generation_options;
        break;
      case 'seed':
        delete result.seed;
        break;
      case 'guidance_scale':
        delete result.guidance_scale;
        break;
      case 'output_format':
        delete result.output_format;
        break;
      case 'tools':
        delete result.tools;
        break;
    }
  }
  return result;
}
