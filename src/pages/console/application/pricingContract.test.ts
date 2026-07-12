import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSibling = (name: string): string => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');

describe('application purchase pricing contract', () => {
  it.each(['Extra.vue', 'Subscribe.vue'])('%s uses the backend-resolved Application markup', (file) => {
    const source = readSibling(file);
    expect(source).toContain('getApplicationMarkupRatio');
    expect(source).not.toContain('getSiteMarkupRatio(');
  });

  it('subscription preview uses the same Period Application as order creation', () => {
    const source = readSibling('Subscribe.vue');
    expect(source).toContain('getApplicationMarkupRatio(this.application2, this.site)');
    expect(source).toContain('application_ids: [this.application2.id]');
  });

  it('usage checkout requires a selected compatible package', () => {
    const source = readSibling('Extra.vue');
    expect(source).toContain(':disabled="!pricingAvailable || !package"');
    expect(source).toContain('!this.pricingAvailable || !this.package');
  });

  it('subscription checkout rejects unsupported durations', () => {
    const source = readSibling('Subscribe.vue');
    expect(source).toContain('packages.length === 0');
    expect(source).toContain(':disabled="!item.available"');
    expect(source).toContain('package_ids: packages.map((p) => p.id)');
  });

  it.each(['Extra.vue', 'Subscribe.vue'])('%s exposes a retryable load-failure state', (file) => {
    const source = readSibling(file);
    expect(source).toContain('v-else-if="loadFailed"');
    expect(source).toContain("$t('common.button.refresh')");
  });

  it('subscription initialization always clears loading', () => {
    const source = readSibling('Subscribe.vue');
    expect(source).toContain('finally {');
    expect(source).toContain('this.loading = false');
  });
});
