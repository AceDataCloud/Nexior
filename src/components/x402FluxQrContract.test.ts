import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('Flux and QR Art x402 contract', () => {
  it('adds both scenarios to the existing floating payment selector', () => {
    const main = source('layouts/Main.vue');
    ['nanobanana', 'openaiimage', 'flux', 'qrart'].forEach((scenario) => expect(main).toContain(`'${scenario}'`));
  });

  it('quotes and submits each scenario through its own operator', () => {
    const fluxConfig = source('components/flux/ConfigPanel.vue');
    const qrConfig = source('components/qrart/ConfigPanel.vue');
    const fluxPage = source('pages/flux/Index.vue');
    const qrPage = source('pages/qrart/Index.vue');

    expect(fluxConfig).toContain('fluxOperator.quote(buildFluxRequest(this.config))');
    expect(qrConfig).toContain('qrartOperator.quote(buildQrartRequest(this.config))');
    expect(fluxPage).toContain("mode: 'x402'");
    expect(qrPage).toContain("mode: 'x402'");
    expect(fluxPage).toContain('identityToken: this.credential?.token');
    expect(qrPage).toContain('identityToken: this.credential?.token');
  });

  it('does not modify existing scenario history, deletion, or storage behavior', () => {
    const changedFiles = [
      'pages/flux/Index.vue',
      'pages/qrart/Index.vue',
      'components/flux/ConfigPanel.vue',
      'components/qrart/ConfigPanel.vue'
    ];
    expect(changedFiles.every((file) => source(file).includes('scenarioPaymentState'))).toBe(true);
    expect(source('operators/flux.ts')).not.toContain('localStorage');
    expect(source('operators/qrart.ts')).not.toContain('localStorage');
  });
});
