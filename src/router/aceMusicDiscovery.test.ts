import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The production proxy runs as a standalone Node ES module.
import { injectTenantHead } from '../../deploy/production/studio-html-injector.mjs';

const html = '<html><head><title>Home</title></head><body></body></html>';
const page = 'https://studio.acedata.cloud/acemusic';

describe('public ACE Music discovery', () => {
  it('exposes a canonical route and share metadata in the raw HTML', () => {
    for (const metadata of [null, { title: 'Ace Data Cloud' }]) {
      const result = injectTenantHead(html, metadata, page + '/?lang=en');
      expect(result).toContain('<title>ACE Music - Ace Data Cloud</title>');
      expect(result).toContain(`rel="canonical" href="${page}"`);
      expect(result).toContain('property="og:title" content="ACE Music - Ace Data Cloud"');
      expect(result).toContain('import reference audio');
    }
  });

  it('preserves independent tenant branding and unrelated route titles', () => {
    expect(injectTenantHead(html, { title: 'Music Lab' }, 'https://music.example/acemusic')).toContain(
      '<title>Music Lab</title>'
    );
    expect(injectTenantHead(html, { title: 'Studio' }, page + '/unknown')).toContain('<title>Studio</title>');
  });

  it('lists the public route in the sitemap and agent index', () => {
    const asset = (name: string) => readFileSync(new URL(`../../public/${name}`, import.meta.url), 'utf8');
    expect(asset('sitemap.xml')).toContain(`<loc>${page}</loc>`);
    expect(asset('llms.txt')).toContain(`[ACE Music](${page})`);
    expect(asset('robots.txt')).toContain('Allow: /acemusic');
  });
});
