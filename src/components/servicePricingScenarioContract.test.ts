import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const COMPONENT_ROOT = path.resolve(__dirname);
const PANELS = [
  'digitalhuman/ConfigPanel.vue',
  'fish/ConfigPanel.vue',
  'flux/ConfigPanel.vue',
  'grokvideo/ConfigPanel.vue',
  'hailuo/ConfigPanel.vue',
  'kling/ConfigPanel.vue',
  'kling/MotionPanel.vue',
  'kling/TalkingPhotoPanel.vue',
  'luma/ConfigPanel.vue',
  'maestro/ConfigPanel.vue',
  'midjourney/ConfigPanel.vue',
  'minimax/ConfigPanel.vue',
  'nanobanana/ConfigPanel.vue',
  'omni/ConfigPanel.vue',
  'openaiimage/ConfigPanel.vue',
  'pika/ConfigPanel.vue',
  'pixverse/ConfigPanel.vue',
  'producer/ConfigPanel.vue',
  'qrart/ConfigPanel.vue',
  'seedance/ConfigPanel.vue',
  'seedream/ConfigPanel.vue',
  'serp/SearchPanel.vue',
  'sora/ConfigPanel.vue',
  'suno/ConfigPanel.vue',
  'veo/ConfigPanel.vue',
  'wan/ConfigPanel.vue',
  'webextrator/ConfigPanel.vue'
] as const;

describe('service pricing scenario coverage', () => {
  it.each(PANELS)('%s uses the shared pricing summary with its service', (relativePath) => {
    const source = fs.readFileSync(path.join(COMPONENT_ROOT, relativePath), 'utf8');
    expect(source).toContain('<service-pricing-summary');
    expect(source).toContain(':service="service"');
    expect(source).toContain("import ServicePricingSummary from '../common/ServicePricingSummary.vue';");
    expect(source).not.toContain("import Consumption from '../common/Consumption.vue';");
    expect(source).not.toContain('ServicePricingDialog');
  });

  it.each(PANELS.filter((relativePath) => relativePath !== 'kling/MotionPanel.vue'))(
    '%s passes its current estimate to the shared summary',
    (relativePath) => {
      const source = fs.readFileSync(path.join(COMPONENT_ROOT, relativePath), 'utf8');
      expect(source).toMatch(/:value="(?:consumption|estimatedCredits)"/);
    }
  );

  it('preserves the per-second Motion Control estimate', () => {
    const source = fs.readFileSync(path.join(COMPONENT_ROOT, 'kling/MotionPanel.vue'), 'utf8');
    expect(source).toContain(':value="consumption"');
    expect(source).toContain(':rate-unit="$t(\'kling.name.perSecond\')"');
    expect(source).toContain(':note="$t(\'kling.message.motionPricingNote\')"');
  });

  it.each(
    PANELS.filter((relativePath) => {
      const source = fs.readFileSync(path.join(COMPONENT_ROOT, relativePath), 'utf8');
      return source.includes('<scenario-payment-mode');
    })
  )('%s hides pricing in wallet mode', (relativePath) => {
    const source = fs.readFileSync(path.join(COMPONENT_ROOT, relativePath), 'utf8');
    expect(source).toMatch(/<service-pricing-summary\s+(?:[^>]*\s)?v-if="!walletMode"/);
    expect(source).not.toContain(':show-consumption="!walletMode"');
  });

  it('does not duplicate the scenario entry in nested or result components', () => {
    const excluded = ['digitalhuman/config/VoiceCloneDialog.vue', 'midjourney/tasks/TaskItem.vue'];
    for (const relativePath of excluded) {
      const source = fs.readFileSync(path.join(COMPONENT_ROOT, relativePath), 'utf8');
      expect(source).not.toContain('ServicePricingSummary');
    }
  });
});
