// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { describe, expect, it, vi } from 'vitest';
import DiscoveryHome from './DiscoveryHome.vue';

const works = [
  {
    id: 'official:pulsecam',
    title: 'Beyond the Edge',
    description: 'TVC',
    category: 'commercial',
    creator_name: 'Poivelle Studio',
    cover_url: 'https://cdn.acedata.cloud/a.jpg',
    source: 'official',
    tags: []
  },
  {
    id: 'official:moonlit-signal',
    title: 'Moonlit Signal',
    description: 'MV',
    category: 'music_video',
    creator_name: 'Poivelle Studio',
    cover_url: 'https://cdn.acedata.cloud/b.jpg',
    source: 'official',
    tags: []
  }
];

describe('Poivelle DiscoveryHome', () => {
  it('shows the prompt composer and copies a work into the studio', async () => {
    const store = createStore({ state: { poivelle: { projects: [], discoveryWorks: works } } } as any);
    store.dispatch = vi.fn().mockResolvedValue({ id: 'project' });
    const wrapper = mount(DiscoveryHome, {
      global: { plugins: [store], mocks: { $t: (key: string) => key } }
    });

    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.findAll('.work-card')).toHaveLength(2);
    await wrapper.find('.work-copy > button').trigger('click');

    expect(store.dispatch).toHaveBeenCalledWith(
      'poivelle/copyDiscoveryWork',
      expect.objectContaining({ work_id: 'official:pulsecam' })
    );
    expect(wrapper.emitted('open-studio')).toHaveLength(1);
  });

  it('falls back to the first available workflow and hides a failed cover', async () => {
    const store = createStore({
      state: {
        poivelle: { projects: [], discoveryWorks: [{ ...works[1], tags: undefined }], status: {}, error: undefined }
      }
    } as any);
    store.dispatch = vi.fn().mockResolvedValue({ id: 'project' });
    const wrapper = mount(DiscoveryHome, {
      global: { plugins: [store], mocks: { $t: (key: string) => key } }
    });

    await wrapper.find('textarea').setValue('A new performance film');
    await wrapper.find('form').trigger('submit');
    expect(store.dispatch).toHaveBeenCalledWith(
      'poivelle/copyDiscoveryWork',
      expect.objectContaining({ work_id: 'official:moonlit-signal' })
    );

    await wrapper.find('.work-card img').trigger('error');
    expect(wrapper.find('.work-card img').exists()).toBe(false);
    expect(wrapper.find('.work-card .cover svg').exists()).toBe(true);
    await wrapper.find('.search input').setValue('moonlit');
    expect(wrapper.findAll('.work-card')).toHaveLength(1);
  });

  it('dispatches only one copy while the first request is pending', async () => {
    let resolveCopy: (value: unknown) => void = () => undefined;
    const pendingCopy = new Promise((resolve) => {
      resolveCopy = resolve;
    });
    const store = createStore({
      state: { poivelle: { projects: [], discoveryWorks: works, status: {}, error: undefined } }
    } as any);
    store.dispatch = vi.fn((type: string) => (type === 'poivelle/copyDiscoveryWork' ? pendingCopy : Promise.resolve()));
    const wrapper = mount(DiscoveryHome, {
      global: { plugins: [store], mocks: { $t: (key: string) => key } }
    });
    vi.mocked(store.dispatch).mockClear();

    const button = wrapper.find('.work-copy > button');
    await Promise.all([button.trigger('click'), button.trigger('click')]);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    resolveCopy({ id: 'project' });
    await pendingCopy;
  });
});
