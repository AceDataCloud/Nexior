import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');
const rootSource = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('x402 image scenario contract', () => {
  it('keeps the wallet selector feature-gated and shared by both scenarios', () => {
    const selector = source('components/common/ScenarioPaymentMode.vue');
    expect(selector).toContain('isScenarioX402Enabled()');
    expect(selector).toContain('scenarioPaymentMode.value = value');
    expect(source('components/nanobanana/ConfigPanel.vue')).toContain('<scenario-payment-mode');
    expect(source('components/openaiimage/ConfigPanel.vue')).toContain('<scenario-payment-mode');
  });

  it('keeps both wallet submissions asynchronous and leaves Credits operators intact', () => {
    const nano = source('pages/nanobanana/Index.vue');
    const openAI = source('pages/openaiimage/Index.vue');
    expect(nano).toContain('async: true');
    expect(nano).toContain('nanobananaOperator.generate(request, { token })');
    expect(nano).toContain('submitNanoWithX402');
    expect(openAI).toContain('async: true');
    expect(openAI).toContain('openaiimageOperator.generate(generateRequest, { token })');
    expect(openAI).toContain('submitOpenAIImageWithX402');
    expect(openAI).toContain('gptEditCreditsOnly');
  });

  it('never uses the legacy broadcast-before-service Solana path', () => {
    const client = source('utils/x402/scenarioClient.ts');
    expect(client).toContain('createX402PaymentHandler');
    expect(client).toContain("preferScheme: 'exact'");
    expect(client).not.toContain('signAndSendTransaction');
    expect(client).not.toContain('executeSolanaPayment');
  });

  it('keeps development and production traffic on the dedicated x402 host', () => {
    const nginx = rootSource('nginx.conf');
    const vite = rootSource('vite.config.ts');
    expect(nginx).toContain('location /x402-api/');
    expect(nginx).toContain('proxy_set_header Host x402.acedata.cloud;');
    expect(nginx).toContain('proxy_ssl_server_name on;');
    expect(vite).toContain("'/x402-api'");
    expect(vite).toContain("'https://x402.acedata.cloud'");
  });
});
