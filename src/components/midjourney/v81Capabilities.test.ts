// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

describe('Midjourney V8.1 and V8.2 capability controls', () => {
  const panel = source('./ConfigPanel.vue');
  const versionSelector = source('./config/VersionSelector.vue');
  const modeSelector = source('./config/ModeSelector2.vue');
  const qualitySelector = source('./config/QualitySelector.vue');
  const operator = source('../../operators/midjourney.ts');

  it('keeps Quality hidden only for V8.1', () => {
    expect(panel).toContain('<quality-selector v-if="config?.version !== \'8.1\'"');
  });

  it('recommends V8.2 and normalizes persisted values only for V8.1', () => {
    expect(versionSelector).toContain("const DEFAULT_VERSION = '8.2'");
    expect(versionSelector).toContain("value: '8.2'");
    expect(versionSelector).toContain("val === '8.1' ? { quality: undefined");
    expect(versionSelector).toContain("config.mode === 'turbo' ? 'fast' : config.mode");
    expect(versionSelector).toContain("val === '8.1' && (config.quality || config.mode === 'turbo')");
  });

  it('removes Turbo from V8.1 mode options and resets stale selections', () => {
    expect(modeSelector).toContain("this.type === 'imagine' && this.version === '8.1'");
    expect(modeSelector).toContain("filter((option) => option.value !== 'turbo')");
    expect(modeSelector).toContain("if (val && this.value === 'turbo')");
    expect(modeSelector).toContain('this.value = DEFAULT_MODE');
  });

  it('keeps V8.2 in the V8 control family while preserving V8.1 request limits', () => {
    expect(panel).toContain("['8', '8.1', '8.2'].includes");
    expect(modeSelector).toContain("return this.$store.state.midjourney.config.type || 'imagine'");
    expect(qualitySelector).toContain("return this.version === '8'");
    expect(qualitySelector).toContain("return this.version === '8.2'");
    expect(qualitySelector).toContain("value: '2'");
    expect(operator).toContain("const isV81 = config.version === '8.1'");
    expect(operator.match(/\.\.\.\(!isV81 \? \{ quality:/g)).toHaveLength(2);
    expect(operator).toContain('mode: isV81 ? MIDJOURNEY_DEFAULT_MODE : config.mode || MIDJOURNEY_DEFAULT_MODE');
  });
});
