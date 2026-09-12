import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('tenant brand discovery routes', () => {
  it('keeps all discovery links in the initial HTML', () => {
    const html = source('index.html');
    expect(html).toContain('rel="icon" href="/favicon.ico"');
    expect(html).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
    expect(html).not.toContain('querySelectorAll(\'link[rel="icon"],link[rel="apple-touch-icon"]\')');
  });

  it.each(['favicon.ico', 'apple-touch-icon.png'])('proxies /%s by request host', (asset) => {
    const nginx = source('nginx.conf');
    expect(nginx).toContain(`location = /${asset}`);
    expect(nginx).toContain(`/api/v1/site-assets/$host/`);
  });
});
