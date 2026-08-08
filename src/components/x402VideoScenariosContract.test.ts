import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

const scenarios = [
  'luma',
  'pika',
  'pixverse',
  'hailuo',
  'veo',
  'seedance',
  'sora',
  'wan',
  'omni',
  'grokvideo',
  'minimax',
  'maestro'
] as const;

const builders: Record<(typeof scenarios)[number], string> = {
  luma: 'buildLumaRequest',
  pika: 'buildPikaRequest',
  pixverse: 'buildPixverseRequest',
  hailuo: 'buildHailuoRequest',
  veo: 'buildVeoRequest',
  seedance: 'normalizeSeedanceRequest',
  sora: 'buildSoraRequest',
  wan: 'buildWanRequest',
  omni: 'buildOmniRequest',
  grokvideo: 'buildGrokVideoRequest',
  minimax: 'buildMinimaxRequest',
  maestro: 'buildMaestroRequest'
};

describe('standard video x402 contract', () => {
  it('registers every standard video scenario in the floating payment selector', () => {
    const main = source('layouts/Main.vue');
    scenarios.forEach((scenario) => expect(main).toContain(`'${scenario}'`));
  });

  it.each(scenarios)('%s quotes and submits its scenario-owned request', (scenario) => {
    const config = source(`components/${scenario}/ConfigPanel.vue`);
    const page = source(`pages/${scenario}/Index.vue`);
    const builder = builders[scenario];

    expect(config).toContain(`<scenario-payment-mode scenario="${scenario}" />`);
    expect(config).toContain('.quote(');
    expect(config).toContain(builder);
    expect(page).toContain(builder);
    expect(page).toContain("mode: 'x402'");
    expect(page).toContain('identityToken: this.credential?.token');
    expect(page).toContain('walletTaskIds: string[]');
    expect(page).toContain("mode: 'x402', ids: this.walletTaskIds");
    expect(page).toContain('error instanceof X402PaymentCancelledError');
  });

  it('keeps wallet task discovery in memory and leaves shared history/delete behavior untouched', () => {
    scenarios.forEach((scenario) => {
      const page = source(`pages/${scenario}/Index.vue`);
      expect(page).not.toContain('localStorage');
      expect(page).not.toContain('sessionStorage');
    });
    expect(source('store/factories/createTaskActions.ts')).not.toContain('x402-video-standard');
  });
});
