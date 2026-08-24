import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

const guardedServices = [
  'flux',
  'hailuo',
  'kling',
  'maestro',
  'pika',
  'pixverse',
  'producer',
  'qrart',
  'qwenimage',
  'seedream',
  'sora',
  'veo',
  'wan'
] as const;

const quotedServices = [
  'flux',
  'hailuo',
  'kling',
  'maestro',
  'midjourney',
  'pika',
  'pixverse',
  'producer',
  'qrart',
  'seedance',
  'sora',
  'veo',
  'wan'
] as const;

describe('generation input integration contract', () => {
  it.each(guardedServices)('%s guards its submit handler and button', (service) => {
    expect(source(`pages/${service}/Index.vue`)).toContain(`getGenerationInputError('${service}', request)`);
    const panel = source(`components/${service}/ConfigPanel.vue`);
    expect(panel).toContain(`canSubmitGeneration('${service}'`);
    expect(panel).toContain(':disabled="!canGenerate"');
  });

  it.each(quotedServices)('%s suppresses invalid quotes and stale responses', (service) => {
    const panel = source(`components/${service}/ConfigPanel.vue`);
    expect(panel).toContain('if (!this.canGenerate) return;');
    expect(panel).toContain("state.mode === 'wallet' && this.canGenerate");
  });

  it('keeps Midjourney Describe prompt-free while guarding Imagine and Videos', () => {
    const page = source('pages/midjourney/Index.vue');
    const panel = source('components/midjourney/ConfigPanel.vue');
    expect(page).toContain('request.prompt?.trim()');
    expect(panel).toContain("if (this.type === 'describe') return Boolean(this.config?.image_url)");
    expect(panel).toContain("canSubmitGeneration('midjourney-imagine'");
    expect(panel).toContain("canSubmitGeneration('midjourney-videos'");
  });

  it('uses the Seedance normalizer for both submit and quote validation', () => {
    expect(source('utils/seedance.ts')).toContain("reject: 'generationInputRequired'");
    const panel = source('components/seedance/ConfigPanel.vue');
    expect(panel).toContain('normalizeSeedanceRequest(this.config)');
    expect(panel).toContain("canSubmitGeneration('seedance', request)");
  });
});
