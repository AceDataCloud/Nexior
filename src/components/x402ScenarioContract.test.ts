import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('x402 image scenario contract', () => {
  it('moves scenario-specific payment selection into the top-right status dialog', () => {
    const status = source('components/application/Status.vue');
    const selector = source('components/common/ScenarioPaymentMode.vue');
    expect(status).toContain('scenarioPaymentState(this.scenario)');
    expect(status).toContain('setScenarioPaymentMode(this.scenario, value)');
    expect(status).toContain('solana-wallet-picker-dialog');
    expect(status).toContain('value="base"');
    expect(status).toContain('value="solana"');
    expect(status).toContain('discoverEvmWallets');
    expect(source('components/order/X402Pay.vue')).toContain('solana-wallet-picker-dialog');
    expect(selector).not.toContain('solana-wallet-picker-dialog');
    expect(selector).not.toContain('el-radio');
  });

  it('keeps a lightweight server-quoted price row in both config panels', () => {
    const selector = source('components/common/ScenarioPaymentMode.vue');
    const nano = source('components/nanobanana/ConfigPanel.vue');
    const openAI = source('components/openaiimage/ConfigPanel.vue');
    expect(selector).toContain('state.quoteUsdc');
    expect(nano).toContain('<scenario-payment-mode scenario="nanobanana"');
    expect(nano).toContain('nanobananaOperator.quote(');
    expect(nano).toContain('this.identityToken');
    expect(source('pages/nanobanana/Index.vue')).toContain(':identity-token="credential?.token"');
    expect(openAI).toContain('<scenario-payment-mode scenario="openaiimage"');
    expect(openAI).toContain('openaiimageOperator.quote(');
    expect(openAI).toContain('this.identityToken');
    expect(source('pages/openaiimage/Index.vue')).toContain(':identity-token="credential?.token"');
  });

  it('keeps both submissions async and routes both modes through existing operators', () => {
    const requests = source('utils/x402/imageRequests.ts');
    const nano = source('pages/nanobanana/Index.vue');
    const openAI = source('pages/openaiimage/Index.vue');
    expect(requests).toContain('async: true');
    expect(nano).toContain('nanobananaOperator.generate(request');
    expect(nano).toContain("mode: 'x402'");
    expect(openAI).toContain('openaiimageOperator.generate(generateRequest');
    expect(openAI).toContain("mode: 'x402'");
    expect(openAI).toContain('gptEditCreditsOnly');
  });

  it('keeps payment generic and never broadcasts before service delivery', () => {
    const operator = source('operators/x402.ts');
    expect(operator).toContain('buildSolanaPayment');
    expect(operator).toContain('latest-blockhash');
    expect(operator).not.toContain('signSolanaPayment');
    expect(operator).not.toContain('signAndSendTransaction');
    expect(operator).not.toContain('localStorage');
  });

  it('uses one shared wallet resolver and prefers Base EIP-3009', () => {
    const operator = source('operators/x402.ts');
    expect(operator).toContain('signEVMPayment');
    expect(operator).toContain("BASE_NETWORK = 'eip155:8453'");
    expect(operator).toContain('resolveX402WalletContext');
    const roots = ['pages', 'components'];
    const legacy = roots.flatMap((root) =>
      fs
        .readdirSync(path.resolve(process.cwd(), 'src', root), { recursive: true })
        .filter((name) => String(name).endsWith('.vue'))
        .map((name) => path.join(root, String(name)))
        .filter((name) => source(name).includes('getWalletContext(): X402WalletContext'))
    );
    expect(legacy.length).toBeGreaterThan(0);
    expect(legacy.every((name) => source(name).includes('resolveX402WalletContext'))).toBe(true);
  });

  it('attaches platform identity only to the signed retry', () => {
    const operator = source('operators/x402.ts');
    const nano = source('pages/nanobanana/Index.vue');
    const openAI = source('pages/openaiimage/Index.vue');
    expect(operator).toContain('options.identityToken');
    expect(nano).toContain('identityToken: this.credential?.token');
    expect(openAI).toContain('identityToken: this.credential?.token');
    expect(nano).toContain('this.walletMode && !this.credential?.token');
    expect(openAI).toContain('this.walletMode && !this.credential?.token');
  });

  it('calls the dedicated x402 host directly without a frontend proxy', () => {
    expect(source('constants/endpoint.ts')).toContain("BASE_URL_X402 = 'https://x402.acedata.cloud'");
  });
});
