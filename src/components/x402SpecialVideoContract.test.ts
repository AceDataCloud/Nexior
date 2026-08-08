import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('special video x402 contract', () => {
  it('registers Kling and Digital Human while disabling wallet mode for Kling Motion', () => {
    const main = source('layouts/Main.vue');
    const klingPage = source('pages/kling/Index.vue');

    expect(main).toContain("'kling'");
    expect(main).toContain("'digitalhuman'");
    expect(main).toContain("this.appName === 'kling'");
    expect(main).toContain("taskType === 'motion'");
    expect(klingPage).toContain("if (value === 'motion') setScenarioPaymentMode('kling', 'credits')");
    expect(source('components/kling/MotionPanel.vue')).not.toContain('ScenarioPaymentMode');
    expect(klingPage).toContain('klingOperator.motion(request, { token })');
  });

  it('keeps Kling video and talking-photo quote/submit endpoints separate', () => {
    const videoPanel = source('components/kling/ConfigPanel.vue');
    const talkingPanel = source('components/kling/TalkingPhotoPanel.vue');
    const page = source('pages/kling/Index.vue');

    expect(videoPanel).toContain('klingOperator.quote(buildKlingVideoRequest(this.config))');
    expect(talkingPanel).toContain('klingOperator.quoteTalkingPhoto(buildKlingTalkingPhotoRequest(this.config))');
    expect(page).toContain('klingOperator.generate(request, options)');
    expect(page).toContain('klingOperator.talkingPhoto(request, options)');
    expect(page).toContain('identityToken: this.credential?.token');
    expect(page).toContain("mode: 'x402', ids: this.walletTaskIds");
  });

  it('keeps Digital Human video and voice clone payment state independent', () => {
    const config = source('components/digitalhuman/ConfigPanel.vue');
    const dialog = source('components/digitalhuman/config/VoiceCloneDialog.vue');
    const page = source('pages/digitalhuman/Index.vue');

    expect(config).toContain('digitalHumanOperator.quote(request)');
    expect(config).toContain('buildDigitalHumanVideoRequest(this.config, this.faceMode, this.voiceMode)');
    expect(dialog).toContain('digitalHumanOperator.quoteVoice(this.voiceRequest())');
    expect(dialog).toContain('voiceQuoteUsdc');
    expect(dialog).not.toContain("scenarioPaymentState('digitalhuman').quoteUsdc");
    expect(dialog).toContain("token ? { token } : { mode: 'x402' }");
    expect(page).toContain("mode: 'x402', ids: this.walletTaskIds");
    expect(page).toContain('identityToken: this.credential?.token');
  });

  it('does not add persistent task history or change shared delete behavior', () => {
    ['pages/kling/Index.vue', 'pages/digitalhuman/Index.vue'].forEach((file) => {
      expect(source(file)).not.toContain('localStorage');
      expect(source(file)).not.toContain('sessionStorage');
    });
  });
});
