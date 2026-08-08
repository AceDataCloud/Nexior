import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const page = readFileSync(fileURLToPath(new URL('./List.vue', import.meta.url)), 'utf8');
const apiFilter = page.match(/<el-col v-if="type === serviceType\.API"[^>]*>[\s\S]*?<\/el-col>/)?.[0] || '';

describe('usage API select loading contract', () => {
  it('keeps the select mounted and shows loading inside its dropdown', () => {
    expect(apiFilter).toContain(':loading="apisLoading"');
    expect(apiFilter).not.toContain('<el-skeleton');
    expect(apiFilter).not.toMatch(/<el-select\s+v-else/);
  });

  it('preloads API options when the page mounts', () => {
    expect(page).toMatch(/mounted\(\)\s*\{[\s\S]*?this\.onFetchApis\(\)/);
  });
});
