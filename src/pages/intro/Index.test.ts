// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { CHAT_MODEL_ICON_GLM } from '@/constants/chat';
import zhIntro from '@/i18n/zh-CN/intro.json';
import Intro from './Index.vue';
import { INTRO_SHOTS } from './data';

const studioFeatures = {
  chatgpt: { enabled: true },
  claude: { enabled: true },
  gemini: { enabled: true },
  grok: { enabled: true },
  deepseek: { enabled: false },
  kimi: { enabled: false },
  midjourney: { enabled: false },
  nanobanana: { enabled: true },
  openaiimage: { enabled: true },
  seedream: { enabled: true },
  flux: { enabled: false },
  qrart: { enabled: false },
  kling: { enabled: true },
  veo: { enabled: true },
  seedance: { enabled: true },
  grokvideo: { enabled: true },
  sora: { enabled: false },
  hailuo: { enabled: false },
  luma: { enabled: false },
  pixverse: { enabled: false },
  omni: { enabled: false },
  suno: { enabled: true },
  fish: { enabled: true },
  producer: { enabled: false },
  maestro: { enabled: true },
  digitalhuman: { enabled: false },
  serp: { enabled: false },
  webextrator: { enabled: false },
  codingBridge: { enabled: true }
};

const t = (key: string) => key;

const mountIntro = (site: Record<string, unknown>) =>
  shallowMount(Intro, {
    global: {
      stubs: {
        ElButton: { template: '<button><slot /></button>' },
        ConfirmIcon: true,
        NextIcon: true
      },
      mocks: {
        $t: t,
        $i18n: { locale: 'zh-CN' },
        $router: { push: vi.fn() },
        $store: { state: { site } }
      }
    }
  });

describe('/intro site capability filtering', () => {
  it('renders only Studio-enabled capabilities and matching screenshots', () => {
    const wrapper = mountIntro({ id: 'studio', origin: 'studio.acedata.cloud', features: studioFeatures });
    const text = wrapper.text();

    for (const enabled of [
      'ChatGPT',
      'Claude',
      'Gemini',
      'Grok',
      'Nano Banana',
      'GPT Image',
      'Seedream',
      'Kling',
      'Veo',
      'Seedance',
      'Grok Imagine',
      'Suno',
      'Fish Audio',
      'Maestro',
      'Coding Bridge'
    ]) {
      expect(text).toContain(enabled);
    }
    for (const disabled of [
      'DeepSeek',
      'Kimi',
      'Midjourney',
      'Flux',
      'QR Art',
      'Sora',
      'Hailuo',
      'Luma',
      'Pixverse',
      'Omni',
      'Producer',
      'Digital Human',
      'SERP',
      'WebExtrator'
    ]) {
      expect(text).not.toContain(disabled);
    }

    const images = wrapper.findAll('img').map((image) => image.attributes('src'));
    expect(images).toContain(INTRO_SHOTS.nanobananaDesktop.zh);
    expect(images).not.toContain(INTRO_SHOTS.midjourneyDesktop.zh);
    expect(images).not.toContain(INTRO_SHOTS.serpDesktop.zh);
    expect(images).not.toContain(INTRO_SHOTS.webextratorDesktop.zh);
    expect(images).not.toContain(INTRO_SHOTS.digitalHumanDesktop.zh);
  });

  it('gives every visible product card a recognizable logo', () => {
    const wrapper = mountIntro({ id: 'studio', origin: 'studio.acedata.cloud', features: studioFeatures });
    const cards = wrapper.findAll('.model-card');
    const logos = wrapper.findAll('.model-card__logo img');

    expect(cards).toHaveLength(16);
    expect(logos).toHaveLength(cards.length);
    expect(logos.every((logo) => Boolean(logo.attributes('src')))).toBe(true);
    expect(logos.some((logo) => logo.attributes('src') === CHAT_MODEL_ICON_GLM)).toBe(true);
    expect(wrapper.find('.model-grid').attributes('style')).toContain('--model-grid-columns: 5');
  });

  it('uses outward-facing campaign headlines instead of configuration labels', () => {
    const copy = Object.values(zhIntro)
      .map((entry) => entry.message)
      .join('\n');

    expect(copy).not.toContain('这个站点可用的');
    expect(copy).not.toContain('已经为你准备好这些 AI 能力');
    expect(zhIntro['title.site.video'].message).toBe('让每个想法，都成为一段好作品');
    expect(zhIntro['title.connector'].message).toBe('连接你的数字世界，让 AI 真正行动起来');
  });

  it('filters fixed catalog claims and bullets for disabled tools', () => {
    const wrapper = mountIntro({ id: 'studio', origin: 'studio.acedata.cloud', features: studioFeatures });
    const text = wrapper.text();

    expect(text).not.toContain('intro.bullet.chat.models');
    expect(text).not.toContain('intro.bullet.image.models');
    expect(text).not.toContain('intro.bullet.video.models');
    expect(text).not.toContain('intro.bullet.tools.search');
    expect(text).not.toContain('intro.bullet.tools.extract');
    expect(text).toContain('intro.bullet.tools.coding');
  });

  it('does not flash the full catalog before site configuration loads', () => {
    const wrapper = mountIntro({});

    expect(wrapper.find('.intro').exists()).toBe(false);
    expect(wrapper.find('.intro-loading').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Midjourney');
  });
});
