import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('SERP x402 contract', () => {
  it('registers SERP and uses one request builder for quote and search', () => {
    expect(source('layouts/Main.vue')).toContain("'serp'");
    expect(source('components/serp/SearchPanel.vue')).toContain('serpOperator.quote(buildSerpRequest(this.config))');
    expect(source('store/serp/actions.ts')).toContain('const request = buildSerpRequest(state.config)');
  });

  it('supports wallet identity and cancellation without task history', () => {
    const page = source('pages/serp/Index.vue');
    expect(page).toContain("mode: 'x402'");
    expect(page).toContain('identityToken: this.credential?.token');
    expect(page).toContain('error instanceof X402PaymentCancelledError');
    expect(page).not.toContain('walletTaskIds');
    expect(page).not.toContain('localStorage');
    expect(page).not.toContain('sessionStorage');
  });
});
