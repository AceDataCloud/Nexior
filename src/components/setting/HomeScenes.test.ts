// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { siteOperator } from '@/operators';
import { ElMessageBox } from 'element-plus';
import HomeScenes from './HomeScenes.vue';

vi.mock('@/operators', () => ({ siteOperator: { get: vi.fn(), update: vi.fn() } }));
vi.mock('element-plus', async (load) => {
  const actual = await load<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
    ElMessageBox: { confirm: vi.fn().mockResolvedValue(undefined) }
  };
});

const manager = {
  id: 'site-1',
  configuration_revision: 4,
  home: {
    sections: { banner: { enabled: false } },
    scenes: [{ id: 'video', title: 'Product video', description: '', tools: [{ capability: 'seedance' }] }]
  },
  features: { seedance: { enabled: true }, kling: { enabled: true } }
};

function mountEditor() {
  return mount(HomeScenes, {
    props: { site: { id: 'site-1', features: manager.features } },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missing: (_locale, key) => key })],
      stubs: { ImageCropper: true }
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
    await vi.waitFor(() => expect(wrapper.findAll('.scene-row').length).toBe(1));
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('site.homeScenes.save'))!
      .trigger('click');
    await vi.waitFor(() => expect(siteOperator.update).toHaveBeenCalled());
    const [, payload, revision] = vi.mocked(siteOperator.update).mock.calls[0];
    expect(revision).toBe(4);
    expect(payload.home?.scenes?.[0].title).toBe('Product video');
    expect(payload.home?.sections?.banner?.enabled).toBe(false);
    wrapper.unmount();
  });

  it('edits one scene as a draft and retains tool ordering', async () => {
    const wrapper = mountEditor();
    await vi.waitFor(() => expect(wrapper.find('.scene-row').exists()).toBe(true));
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('site.homeScenes.edit'))!
      .trigger('click');
    const draft = (wrapper.vm as any).$?.setupState?.draft;
    expect(draft?.title).toBe('Product video');
    draft.tools.push({ capability: 'kling' });
    (wrapper.vm as any).$?.setupState?.moveTool(1, -1);
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).$?.setupState?.scenes[0].tools).toEqual([{ capability: 'seedance' }]);
    (wrapper.vm as any).$?.setupState?.finishEdit();
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).$?.setupState?.scenes[0].tools.map((tool: any) => tool.capability)).toEqual([
      'kling',
      'seedance'
    ]);
    expect(siteOperator.update).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('offers saved scene translation and image upload without an exposed URL field', async () => {
    const wrapper = mountEditor();
    await vi.waitFor(() => expect(wrapper.find('.scene-row').exists()).toBe(true));
    (wrapper.vm as any).$?.setupState?.openEdit(0);
    await wrapper.vm.$nextTick();
    const state = (wrapper.vm as any).$?.setupState;
    expect(state.canTranslate('title')).toBe(true);
    expect(state.canTranslate('description')).toBe(true);
    expect(wrapper.find('#home-scene-image').exists()).toBe(false);
    state.draft.title = 'Edited title';
    expect(state.canTranslate('title')).toBe(false);
    state.draft.title = 'Product video';
    state.onImageUploaded('https://cdn.example.com/new-cover.webp');
    await wrapper.vm.$nextTick();
    expect(state.draft.image_url).toBe('https://cdn.example.com/new-cover.webp');
    expect(state.canTranslate('title')).toBe(false);
    expect(siteOperator.update).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('restores defaults only in the draft until Save home page is clicked', async () => {
    const wrapper = mountEditor();
    await vi.waitFor(() => expect(wrapper.find('.scene-row').exists()).toBe(true));
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('site.homeScenes.defaults'))!
      .trigger('click');
    await vi.waitFor(() => expect(ElMessageBox.confirm).toHaveBeenCalled());
    expect(siteOperator.update).not.toHaveBeenCalled();
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('site.homeScenes.save'))!
      .trigger('click');
    await vi.waitFor(() => expect(siteOperator.update).toHaveBeenCalled());
    expect(vi.mocked(siteOperator.update).mock.calls[0][1].home?.scenes).toBeNull();
    wrapper.unmount();
  });

  it('does not overwrite a newer revision', async () => {
    const wrapper = mountEditor();
    await vi.waitFor(() => expect(wrapper.find('.scene-row').exists()).toBe(true));
    vi.mocked(siteOperator.get).mockResolvedValueOnce({ data: { ...manager, configuration_revision: 5 } } as any);
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('site.homeScenes.save'))!
      .trigger('click');
    expect(siteOperator.update).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
