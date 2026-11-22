// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import studioRouteSeo from '../../deploy/production/studio-route-seo.json';
// @ts-expect-error The production proxy runs as a standalone Node ES module.
import { injectTenantHead } from '../../deploy/production/studio-html-injector.mjs';

const html = '<html><head><title>Home</title></head><body></body></html>';
const studio = 'https://studio.acedata.cloud';

function renderedHead(url: string, metadata: { title: string; description?: string } | null) {
  return new DOMParser().parseFromString(injectTenantHead(html, metadata, url), 'text/html').head;
}

describe('Studio landing page discovery', () => {
  it.each(Object.entries(studioRouteSeo))('renders the shared metadata for /%s', (slug, seo) => {
    const page = `${studio}/${slug}`;
    const head = renderedHead(page + '/?lang=en', { title: 'Studio' });
    const title = `${seo.title} - Studio`;
    expect(head.querySelector('title')?.textContent).toBe(title);
    expect(head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(seo.description);
    expect(head.querySelector('meta[name="keywords"]')?.getAttribute('content')).toBe(seo.keywords.join(', '));
    expect(head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(title);
    expect(head.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe('Studio');
    expect(head.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(title);
    expect(head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(page);
    expect(head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(page);
  });

  it('canonicalizes a case-insensitive service URL to its registered landing path', () => {
    const head = renderedHead(studio + '/QWEN-IMAGE/', { title: 'Studio' });
    expect(head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(studio + '/qwen-image');
  });

  it('uses the official brand for a known page when site metadata is unavailable', () => {
    expect(renderedHead(studio + '/suno', null).querySelector('title')?.textContent).toBe('Suno - Ace Data Cloud');
  });

  it('preserves the site metadata and canonical domain on a white-label landing page', () => {
    const url = 'https://music.example/acemusic';
    const head = renderedHead(url, { title: 'Music Lab', description: 'Independent studio' });
    expect(head.querySelector('title')?.textContent).toBe('Music Lab');
    expect(head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Independent studio');
    expect(head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(url);
  });

  it.each(['/', '/acemusic/unknown', '/chatgpt/conversations/private', '/constructor'])(
    'keeps the existing site or upstream head for %s',
    (path) => {
      expect(renderedHead(studio + path, { title: 'Studio' }).querySelector('title')?.textContent).toBe('Studio');
      expect(injectTenantHead(html, null, studio + path)).toBe(html);
    }
  );

  it('lists the ACE Music landing page in the sitemap and agent index', () => {
    const asset = (name: string) => readFileSync(`public/${name}`, 'utf8');
    const page = studio + '/acemusic';
    expect(asset('sitemap.xml')).toContain(`<loc>${page}</loc>`);
    expect(asset('llms.txt')).toContain(`[ACE Music](${page})`);
    expect(asset('robots.txt')).toContain('Allow: /acemusic');
  });
});
