// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CAPABILITY_KEYS } from '@/constants/capabilities';

const source = (relativePath: string) => readFileSync(resolve(__dirname, '../../', relativePath), 'utf8');

describe('Headshots Nexior shutdown', () => {
  it('keeps every user-facing entry point offline', () => {
    expect(CAPABILITY_KEYS).not.toContain('headshots');
    expect(source('router/index.ts')).not.toContain("import headshots from './headshots'");
    expect(source('router/index.ts')).not.toMatch(/^\s+headshots,\s*$/m);
    expect(source('components/common/TopHeader.vue')).not.toContain('features?.headshots');
    expect(source('pages/index/Index.vue')).not.toContain('features?.headshots');
    expect(source('store/lazy.ts')).not.toContain("headshots: () => import('./headshots')");
    expect(source('models/site.ts')).not.toContain('headshots?:');
    expect(source('../public/robots.txt')).not.toContain('/headshots');
    expect(source('../public/sitemap.xml')).not.toContain('/headshots');
    expect(source('../public/llms.txt')).not.toContain('/headshots');
    expect(source('../README.md')).not.toMatch(/headshots/i);
    expect(source('../docs/PROMOTION.md')).not.toMatch(/headshots/i);
  });
});
