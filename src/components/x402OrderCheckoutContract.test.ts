import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/order/X402Pay.vue'), 'utf8');

describe('x402 order checkout contract', () => {
  it('uses the shared signer for canonical Base requirements', () => {
    expect(source).toContain("'eip155:8453': '0x2105'");
    expect(source).toContain('buildEVMPaymentSignatureHeader(');
    expect(source).toContain('if (this.signing || this.paying) return;');
    expect(source).not.toContain('buildTypedData(');
    expect(source).not.toContain('maxAmountRequired || requirements?.max_amount_required');
    expect(source).not.toContain('btoa(JSON.stringify(payload))');
  });

  it('separates signing and signed-submit telemetry', () => {
    expect(source).toContain("stage = 'sign'");
    expect(source).toContain("stage = 'submit'");
    expect(source).toContain("'signature_created'");
    expect(source).toContain("'signed_post_started'");
    expect(source).toContain("stage === 'sign'");
    expect(source).toContain("'signing_error'");
  });
  it('initializes the Buffer global before loading the Solana SDK', () => {
    const operator = fs.readFileSync(path.resolve(process.cwd(), 'src/operators/x402.ts'), 'utf8');
    const initializeBuffer = operator.indexOf('globalThis.Buffer ??= Buffer');
    const loadSolanaSdk = operator.indexOf("import('@acedatacloud/x402-client/solana')");
    expect(initializeBuffer).toBeGreaterThan(-1);
    expect(loadSolanaSdk).toBeGreaterThan(initializeBuffer);
  });
});
