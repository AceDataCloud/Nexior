import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const galleryPages = [
  ['nanobanana/Index.vue', 'nano-banana'],
  ['openaiimage/Index.vue', 'openai'],
  ['seedream/Index.vue', 'seedream'],
  ['seedance/Index.vue', 'seedance'],
  ['kling/Index.vue', 'kling'],
  ['veo/Index.vue', 'veo'],
  ['grokvideo/Index.vue', 'grok'],
  ['suno/Index.vue', 'suno'],
  ['fish/Tts.vue', 'fish']
] as const;

function readPage(path: string): string {
  return readFileSync(new URL(`./${path}`, import.meta.url), 'utf8');
}

describe('service Gallery tabs integration', () => {
  it.each(galleryPages)('wraps only the %s result panel with Showcase service %s', (page, service) => {
    const source = readPage(page);
    expect(source).toContain(`<showcase-result-tabs service="${service}">`);
    expect(source).toContain("import ShowcaseResultTabs from '@/components/common/ShowcaseResultTabs.vue';");
    expect(source).toContain('    ShowcaseResultTabs');
    expect(source).toContain('<template #tasks>');
    expect(source).toMatch(/<recent-panel[^>]*ref="recentPanel"/);
    expect(source.indexOf('<template #config>')).toBeLessThan(source.indexOf('<showcase-result-tabs'));
    expect(source.match(/<showcase-result-tabs/g)).toHaveLength(1);
  });

  it('preserves Suno task events and its independent preview slot', () => {
    const source = readPage('suno/Index.vue');
    expect(source).toContain(':loading="loadingMore || loadingAll"');
    expect(source).toContain('@reach-top="onReachTop"');
    expect(source).toContain('@load-all="onLoadAll"');
    expect(source).toContain('@wallet-task="onWalletTask"');
    expect(source.indexOf('</showcase-result-tabs>')).toBeLessThan(source.indexOf('<template #preview>'));
    expect(source).toContain('<preview-panel />');
  });

  it.each(['producer/Index.vue', 'fish/Model.vue'])('does not add an empty Gallery to %s', (page) => {
    const source = readPage(page);
    expect(source).not.toContain('ShowcaseResultTabs');
    expect(source).not.toContain('<showcase-result-tabs');
  });
});
