// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => readFileSync(resolve(__dirname, '../..', relativePath), 'utf8');

const components = {
  fish: source('src/components/fish/TabSwitcher.vue'),
  kling: source('src/components/kling/TabSwitcher.vue'),
  midjourney: source('src/components/midjourney/ConfigPanel.vue'),
  producer: source('src/components/producer/ConfigPanel.vue'),
  suno: source('src/components/suno/ConfigPanel.vue'),
  veo: source('src/components/veo/config/ActionSelector.vue')
};

describe('scenario tab style contract', () => {
  it('keeps shared baseline rules in the global utility', () => {
    const styles = source('src/assets/scss/_common.scss');

    expect(styles).toMatch(/\.scenario-tabs\s*{[\s\S]*?> \.el-tabs__header\s*{\s*margin: 0;/);
    expect(styles).toMatch(
      /&\.scenario-tabs--scrollable\s*{[\s\S]*?display: flex;[\s\S]*?flex-direction: column;[\s\S]*?height: 100%;/
    );
    expect(styles).toMatch(/> \.el-tabs__content\s*{\s*flex: 1;\s*min-height: 0;\s*overflow-y: auto;\s*}/);
    expect(styles).toMatch(
      /&\.scenario-tabs--divided > \.el-tabs__header > \.el-tabs__nav-wrap::after\s*{\s*height: 1px;/
    );
  });

  it('opts only compatible top-level tabs into each shared rule', () => {
    Object.values(components).forEach((component) => expect(component).toContain('scenario-tabs'));

    for (const name of ['suno', 'producer', 'midjourney'] as const) {
      expect(components[name]).toContain('scenario-tabs--scrollable');
    }
    for (const name of ['fish', 'kling', 'producer', 'veo'] as const) {
      expect(components[name]).toContain('scenario-tabs--divided');
    }

    expect(source('src/components/suno/config/UploadAudio.vue')).not.toContain('scenario-tabs');
    expect(source('src/components/suno/voice/VoiceManager.vue')).not.toContain('scenario-tabs');
    expect(source('src/components/midjourney/config/ElementsSelector.vue')).not.toContain('scenario-tabs');
    expect(source('src/components/webextrator/ResultPanel.vue')).not.toContain('scenario-tabs');
  });

  it('preserves Kling and Veo readability and overflow rules locally', () => {
    expect(components.kling).toMatch(/:deep\(\.el-tabs__item\)[\s\S]*?height: 48px;[\s\S]*?white-space: normal;/);
    expect(components.kling).toContain('-webkit-line-clamp: 2;');
    expect(components.veo).toMatch(/:deep\(\.el-tabs__nav-scroll\)[\s\S]*?overflow: visible;[\s\S]*?height: 64px;/);
    expect(components.veo).toMatch(/:deep\(\.el-tabs__nav-prev\),[\s\S]*?display: none;/);
    expect(components.veo).toMatch(/:deep\(\.el-tabs__item\)[\s\S]*?min-width: 0;[\s\S]*?overflow-wrap: anywhere;/);
  });
});
