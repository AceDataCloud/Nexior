import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const page = readFileSync(fileURLToPath(new URL('./List.vue', import.meta.url)), 'utf8');
const operationFilter =
  page.match(/<el-col v-if="type === serviceType\.API"[^>]*>[\s\S]*?usage\.field\.operation[\s\S]*?<\/el-col>/)?.[0] ||
  '';

describe('usage operation select loading contract', () => {
  it('keeps the select mounted and shows loading in its dropdown', () => {
    expect(operationFilter).toContain(':loading="apisLoading"');
    expect(operationFilter).toContain(':disabled="!serviceIds.length && !apiIds.length"');
    expect(operationFilter).not.toContain('<el-skeleton');
  });

  it('loads operations after services and ignores stale responses', () => {
    expect(page).toContain('await Promise.all([this.onFetchServices(), this.hydrateApiSelection()])');
    expect(page).toContain('await this.onFetchApis()');
    expect(page).toContain('const seq = ++this.apiFetchSeq');
    expect(page).toContain('if (seq !== this.apiFetchSeq) return');
    expect(page).toContain('const operations = new Map<string, IApi>()');
  });
});
