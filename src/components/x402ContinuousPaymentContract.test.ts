import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('x402 continuous payment contract', () => {
  it('keeps Credits and Wallet as the only top-level payment tabs', () => {
    const status = source('components/application/Status.vue');
    expect(status).toContain('name="credits"');
    expect(status).toContain('name="wallet"');
    expect(status).not.toContain('name="autopay"');
    expect(status).toContain(':continuous-only="scenario === \'chat\'"');
    expect(source('layouts/Main.vue')).toContain("'chat'");
  });

  it('uses the x402 authorization selector without storing payment material', () => {
    const helper = source('utils/x402/continuousPayment.ts');
    expect(helper).toContain("CONTINUOUS_PAYMENT_HEADER = 'X-X402-Authorization'");
    expect(helper).toContain("CONTINUOUS_PAYMENT_PROFILE = 'solana-recurring-delegation-v1'");
    expect(helper).not.toContain('localStorage');
    expect(helper).not.toContain('sessionStorage');
  });

  it('routes active Chat through the existing x402 host and preserves SSE', () => {
    const chat = source('operators/chat.ts');
    expect(chat).toContain("scenarioPaymentState('chat').mode === 'wallet'");
    expect(chat).toContain('continuous ? BASE_URL_X402 : BASE_URL_API');
    expect(chat).toContain('continuousPaymentHeaders(options.token)');
    expect(chat).toContain('payment_authorization_required');
    expect(chat).toContain("Accept: 'text/event-stream'");
  });
});
