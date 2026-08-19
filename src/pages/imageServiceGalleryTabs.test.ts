import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = [
  ['nanobanana', 'nano-banana'],
  ['openaiimage', 'openai'],
  ['seedream', 'seedream']
] as const;

describe('image service Gallery tabs integration', () => {
  it.each(pages)('wraps only the %s result panel with the exact Showcase service', (page, service) => {
    const source = readFileSync(new URL(`./${page}/Index.vue`, import.meta.url), 'utf8');
    expect(source).toContain(`<showcase-result-tabs service="${service}">`);
    expect(source).toContain('<template #tasks>');
    expect(source).toContain('<recent-panel ref="recentPanel"');
    expect(source.indexOf('<config-panel')).toBeLessThan(source.indexOf('<showcase-result-tabs'));
    expect(source.match(/<showcase-result-tabs/g)).toHaveLength(1);
  });

  it('does not add service Gallery tabs to unrelated generators', () => {
    for (const page of ['seedance', 'suno', 'kling', 'veo']) {
      const source = readFileSync(new URL(`./${page}/Index.vue`, import.meta.url), 'utf8');
      expect(source).not.toContain('ShowcaseResultTabs');
      expect(source).not.toContain('<showcase-result-tabs');
    }
  });
});
