import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('x402 image scenario contract', () => {
  it('keeps the wallet selector feature-gated and shared by both scenarios', () => {
    const selector = source('components/common/ScenarioPaymentMode.vue');
    expect(selector).toContain('isScenarioX402Enabled()');
    expect(selector).toContain('scenarioPaymentMode.value = value');
    expect(source('components/nanobanana/ConfigPanel.vue')).toContain('<scenario-payment-mode');
    expect(source('components/openaiimage/ConfigPanel.vue')).toContain('<scenario-payment-mode');
  });

  it('reuses the same Solana wallet picker as order payments', () => {
    const picker = 'solana-wallet-picker-dialog';
    expect(source('components/common/ScenarioPaymentMode.vue')).toContain(picker);
    expect(source('components/order/X402Pay.vue')).toContain(picker);
  });

  it('keeps both submissions async and routes both modes through existing operators', () => {
    const nano = source('pages/nanobanana/Index.vue');
    const openAI = source('pages/openaiimage/Index.vue');
    expect(nano).toContain('async: true');
    expect(nano).toContain('nanobananaOperator.generate(request');
    expect(nano).toContain("mode: 'x402'");
    expect(openAI).toContain('async: true');
    expect(openAI).toContain('openaiimageOperator.generate(generateRequest');
    expect(openAI).toContain("mode: 'x402'");
    expect(openAI).toContain('gptEditCreditsOnly');
  });

  it('keeps payment generic and never broadcasts before service delivery', () => {
    const operator = source('operators/x402.ts');
    expect(operator).toContain('createX402PaymentHandler');
    expect(operator).toContain("preferScheme: 'exact'");
    expect(operator).not.toContain('signAndSendTransaction');
    expect(operator).not.toContain('localStorage');
  });

  it('calls the dedicated x402 host directly without a frontend proxy', () => {
    expect(source('constants/endpoint.ts')).toContain("BASE_URL_X402 = 'https://x402.acedata.cloud'");
  });
});
