// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showcaseOperator } from '@/operators';
import ShowcaseResultTabs from './ShowcaseResultTabs.vue';

vi.mock('@/operators', () => ({ showcaseOperator: { list: vi.fn() } }));
vi.mock('vuex', () => ({
  useStore: () => ({ state: { site: { id: 'studio', features: { nanobanana: { enabled: true } } } } })
}));
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ locale: { value: 'en' } })
}));
vi.mock('./ShowcaseGrid.vue', () => ({
  default: {
    name: 'ShowcaseGrid',
    props: { items: Array, compact: Boolean, masonry: Boolean, detailPreview: Boolean },
    emits: ['select'],
    template: `<button class="showcase-grid-stub" :data-compact="compact" :data-masonry="masonry" :data-detail="detailPreview" @click="$emit('select', items[0])" />`
  }
}));
vi.mock('@/pages/inspiration/components/InspirationDetailDialog.vue', () => ({
  default: {
    name: 'InspirationDetailDialog',
    props: { item: Object },
    emits: ['close'],
    template: `<button class="detail-dialog-stub" @click="$emit('close')" />`
  }
}));

const ElTabsStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="tabs-stub"><slot /></div>'
};
const ElTabPaneStub = {
  props: ['name', 'label'],
  template: '<section :data-pane="name"><slot /></section>'
};
const showcase = {
  id: '196387e7-f217-453f-a678-ed1165e0cbd9',
  service: 'nano-banana',
  task_id: null,
  data: {
    type: 'images',
    request: { prompt: 'Original glass pavilion', model: 'nano-banana-pro', aspect_ratio: '16:9' },
    response: { success: true, data: [{ image_url: 'https://cdn.acedata.cloud/image.jpg' }] }
  }
};

function mountTabs() {
  return mount(ShowcaseResultTabs, {
    props: { service: 'nano-banana' },
    slots: { tasks: '<div class="task-sentinel">Current task instance</div>' },
    global: {
      stubs: { ElTabs: ElTabsStub, ElTabPane: ElTabPaneStub, ElButton: true },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('ShowcaseResultTabs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults to current tasks and does not fetch the gallery', () => {
    const wrapper = mountTabs();
    expect((wrapper.vm as any).activeTab).toBe('tasks');
    expect(wrapper.find('.task-sentinel').exists()).toBe(true);
    expect(showcaseOperator.list).not.toHaveBeenCalled();
  });

  it('loads the exact service once when Gallery is first selected and keeps tasks mounted', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({
      data: [showcase, { ...showcase, id: 'other', service: 'seedream' }]
    } as any);
    const wrapper = mountTabs();
    (wrapper.vm as any).activeTab = 'gallery';
    await vi.waitFor(() => expect(showcaseOperator.list).toHaveBeenCalledWith('nano-banana'));
    await vi.waitFor(() => expect((wrapper.vm as any).resolvedItems).toHaveLength(1));
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props()).toMatchObject({
      compact: true,
      masonry: true,
      detailPreview: true
    });
    expect(wrapper.find('.task-sentinel').exists()).toBe(true);
    (wrapper.vm as any).activeTab = 'tasks';
    (wrapper.vm as any).activeTab = 'gallery';
    await wrapper.vm.$nextTick();
    expect(showcaseOperator.list).toHaveBeenCalledOnce();
  });

  it('opens the resolved showcase in the shared detail dialog and clears it on close', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [showcase] } as any);
    const wrapper = mountTabs();
    (wrapper.vm as any).activeTab = 'gallery';
    await vi.waitFor(() => expect((wrapper.vm as any).resolvedItems).toHaveLength(1));

    await wrapper.get('.showcase-grid-stub').trigger('click');
    const dialog = wrapper.getComponent({ name: 'InspirationDetailDialog' });
    expect(dialog.props('item')).toMatchObject({
      id: showcase.id,
      prompt: 'Original glass pavilion',
      model: 'nano-banana-pro',
      parameters: expect.arrayContaining([
        { key: 'model', value: 'nano-banana-pro' },
        { key: 'aspect_ratio', value: '16:9' }
      ])
    });

    await wrapper.get('.detail-dialog-stub').trigger('click');
    expect(dialog.props('item')).toBeUndefined();
  });

  it('isolates gallery failure and retries without unmounting tasks', async () => {
    vi.mocked(showcaseOperator.list)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: [showcase] } as any);
    const wrapper = mountTabs();
    (wrapper.vm as any).activeTab = 'gallery';
    await vi.waitFor(() => expect((wrapper.vm as any).error).toBe(true));
    expect(wrapper.find('.task-sentinel').exists()).toBe(true);
    await (wrapper.vm as any).load();
    expect(showcaseOperator.list).toHaveBeenCalledTimes(2);
    expect((wrapper.vm as any).error).toBe(false);
    expect((wrapper.vm as any).resolvedItems).toHaveLength(1);
  });
});
