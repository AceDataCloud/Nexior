// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

describe('Midjourney V8.1 capability controls', () => {
  const panel = source('./ConfigPanel.vue');
  const versionSelector = source('./config/VersionSelector.vue');
  const modeSelector = source('./config/ModeSelector2.vue');
  const qualitySelector = source('./config/QualitySelector.vue');
  const page = source('../../pages/midjourney/Index.vue');

  it('hides the unsupported Quality control', () => {
    expect(panel).toContain('<quality-selector v-if="config?.version !== \'8.1\'"');
  });

  it('normalizes persisted Quality and Turbo values when V8.1 is selected', () => {
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

  it('keeps video Turbo available and omits Quality from V8.1 requests', () => {
    expect(modeSelector).toContain("return this.$store.state.midjourney.config.type || 'imagine'");
    expect(qualitySelector).toContain("return this.version === '8'");
    expect(page).toContain("this.config?.version !== '8.1' &&");
    expect(page.match(/\.\.\.\(!isV81 \? \{ quality:/g)).toHaveLength(2);
    expect(page).toContain('mode: isV81 ? MIDJOURNEY_DEFAULT_MODE : this.config?.mode || MIDJOURNEY_DEFAULT_MODE');
  });
});
