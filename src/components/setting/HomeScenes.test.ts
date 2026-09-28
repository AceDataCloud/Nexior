// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { siteOperator } from '@/operators';
import HomeScenes from './HomeScenes.vue';

vi.mock('@/operators', () => ({ siteOperator: { get: vi.fn(), update: vi.fn() } }));
vi.mock('element-plus', async (load) => {
  const actual = await load<typeof import('element-plus')>();
  return { ...actual, ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } };
});

const manager = {
  id: 'site-1',
  configuration_revision: 4,
  home: { scenes: [{ id: 'video', title: 'Product video', description: '', tools: [{ capability: 'seedance' }] }] },
  home_source: { scenes: [{ id: 'video', title: '源标题', description: '', tools: [{ capability: 'seedance' }] }] },
  home_auto_translated_fields: ['scenes.video.title'],
  features: { seedance: { enabled: true } }
};

function mountEditor() {
  return mount(HomeScenes, {
    props: { site: { id: 'site-1', features: manager.features } },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missing: (_locale, key) => key })],
      stubs: { ImageCropper: true, AutoTranslateToggle: true }
    }
  });
}

describe('HomeScenes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(siteOperator.get).mockResolvedValue({ data: structuredClone(manager) } as any);
    vi.mocked(siteOperator.update).mockResolvedValue({ data: structuredClone(manager) } as any);
  });

  it('saves source text and revision without changing unrelated home sections', async () => {
    const wrapper = mountEditor();
    await vi.waitFor(() => expect(wrapper.findAll('.scene-editor').length).toBe(1));
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('site.homeScenes.save'))!
      .trigger('click');
    await vi.waitFor(() => expect(siteOperator.update).toHaveBeenCalled());
    const [, payload, revision] = vi.mocked(siteOperator.update).mock.calls[0];
    expect(revision).toBe(4);
    expect(payload.home?.scenes?.[0].title).toBe('源标题');
    wrapper.unmount();
  });

  it('does not overwrite a newer revision', async () => {
    const wrapper = mountEditor();
    await vi.waitFor(() => expect(wrapper.find('.scene-editor').exists()).toBe(true));
    vi.mocked(siteOperator.get).mockResolvedValueOnce({ data: { ...manager, configuration_revision: 5 } } as any);
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('site.homeScenes.save'))!
      .trigger('click');
    expect(siteOperator.update).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
