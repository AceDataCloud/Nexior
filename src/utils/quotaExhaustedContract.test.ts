import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pagePaths = [
  'digitalhuman/Index.vue',
  'fish/Model.vue',
  'fish/Tts.vue',
  'flux/Index.vue',
  'grokvideo/Index.vue',
  'hailuo/Index.vue',
  'kling/Index.vue',
  'luma/Index.vue',
  'maestro/Index.vue',
  'midjourney/Index.vue',
  'minimax/Index.vue',
  'nanobanana/Index.vue',
  'omni/Index.vue',
  'openaiimage/Index.vue',
  'pika/Index.vue',
  'pixverse/Index.vue',
  'qrart/Index.vue',
  'seedance/Index.vue',
  'seedream/Index.vue',
  'serp/Index.vue',
  'sora/Index.vue',
  'veo/Index.vue',
  'wan/Index.vue',
  'webextrator/Index.vue'
] as const;

const readPage = (path: string) => readFileSync(fileURLToPath(new URL(`../pages/${path}`, import.meta.url)), 'utf8');

describe('shared quota exhausted contract', () => {
  it('routes every production quota branch through the shared controller', () => {
    const sources = pagePaths.map((path) => [path, readPage(path)] as const);
    for (const [path, source] of sources) {
      expect(source, path).toContain("from '@/utils/quotaExhausted'");
      expect(source, path).not.toContain('ERROR_CODE_USED_UP');
      expect(source, path).not.toMatch(/message\.usedUp/);
    }
    const calls = sources.reduce(
      (total, [, source]) => total + (source.match(/showQuotaExhausted\(error/g)?.length || 0),
      0
    );
    expect(calls).toBe(25);
  });

  it('keeps the dialog global rather than service-local', () => {
    const appSource = readFileSync(fileURLToPath(new URL('../App.vue', import.meta.url)), 'utf8');
    expect(appSource.match(/<quota-exhausted-dialog/g)).toHaveLength(1);
    expect(existsSync(fileURLToPath(new URL('../components/common/QuotaExhaustedDialog.vue', import.meta.url)))).toBe(
      true
    );
    expect(existsSync(fileURLToPath(new URL('../components/seedance/QuotaExhaustedDialog.vue', import.meta.url)))).toBe(
      false
    );
  });
});
