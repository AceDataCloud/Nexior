// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { describe, expect, it, vi } from 'vitest';
import DiscoveryHome from './DiscoveryHome.vue';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: {
    props: ['src'],
    template: '<video class="video-player-stub" :src="src" />'
  }
}));

vi.mock('element-plus', async (importOriginal) => {
  const original = await importOriginal<typeof import('element-plus')>();
  return { ...original, ElMessage: { error: vi.fn() } };
});

const works = [
  {
    id: 'official:pulsecam',
    title: 'Beyond the Edge',
    description: 'TVC',
    category: 'commercial',
    creator_name: 'Poivelle Studio',
    cover_url: 'https://cdn.acedata.cloud/a.jpg',
    video_url: 'https://cdn.acedata.cloud/finished-film.mp4',
    source: 'official',
    tags: []
  },
  {
    id: 'official:northstar-origin',
    title: 'Northstar: Origin',
    description: 'Documentary',
    category: 'documentary',
    creator_name: 'Poivelle Studio',
    cover_url: 'https://cdn.acedata.cloud/c.jpg',
    video_url: 'https://cdn.acedata.cloud/northstar.mp4',
    source: 'official',
    copyable: false,
    tags: []
  },
  {
    id: 'official:unsafe',
    title: 'Unsafe Film',
    description: 'Invalid URL',
    category: 'narrative',
    creator_name: 'Poivelle Studio',
    cover_url: 'https://cdn.acedata.cloud/d.jpg',
    video_url: 'http://cdn.example/unsafe.mp4',
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
  const mountHome = (store: ReturnType<typeof createStore>) =>
    mount(DiscoveryHome, {
      global: {
        plugins: [store],
        mocks: { $t: (key: string) => key },
        stubs: {
          ElDialog: {
            props: ['modelValue'],
            template: '<div v-if="modelValue" class="dialog-stub"><slot name="header" /><slot /></div>'
          }
        }
      }
    });

  it('shows the prompt composer and copies a work into the studio', async () => {
    const store = createStore({ state: { poivelle: { projects: [], discoveryWorks: works } } } as any);
    store.dispatch = vi.fn().mockResolvedValue({ id: 'project' });
    const wrapper = mountHome(store);

    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.findAll('.work-card')).toHaveLength(4);
    await wrapper.find('.copy-button').trigger('click');

    expect(store.dispatch).toHaveBeenCalledWith(
      'poivelle/copyDiscoveryWork',
      expect.objectContaining({ work_id: 'official:pulsecam' })
    );
    expect(wrapper.emitted('open-studio')).toHaveLength(1);
  });

  it('opens the real finished film without copying the production thread', async () => {
    const store = createStore({ state: { poivelle: { projects: [], discoveryWorks: works } } } as any);
    store.dispatch = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountHome(store);
    vi.mocked(store.dispatch).mockClear();

    await wrapper.find('.cover-play').trigger('click');

    const player = wrapper.find('.video-player-stub');
    expect(player.exists()).toBe(true);
    expect(player.attributes('src')).toBe('https://cdn.acedata.cloud/finished-film.mp4');
    expect(wrapper.find('.film-dialog-heading strong').text()).toBe('Beyond the Edge');
    expect(store.dispatch).not.toHaveBeenCalledWith('poivelle/copyDiscoveryWork', expect.anything());
  });

  it('plays but does not offer copy for a film without an exact blueprint', () => {
    const store = createStore({ state: { poivelle: { projects: [], discoveryWorks: works } } } as any);
    const wrapper = mountHome(store);
    const northstar = wrapper.findAll('.work-card').find((card) => card.text().includes('Northstar: Origin'))!;
    const unsafe = wrapper.findAll('.work-card').find((card) => card.text().includes('Unsafe Film'))!;

    expect(northstar.find('.play-button').exists()).toBe(true);
    expect(northstar.find('.copy-button').exists()).toBe(false);
    expect(unsafe.find('.play-button').exists()).toBe(false);
    expect(unsafe.find('.cover-play').exists()).toBe(false);
  });

  it('falls back to the first available workflow and hides a failed cover', async () => {
    const moonlit = works.find((work) => work.id === 'official:moonlit-signal')!;
    const store = createStore({
      state: {
        poivelle: { projects: [], discoveryWorks: [{ ...moonlit, tags: undefined }], status: {}, error: undefined }
      }
    } as any);
    store.dispatch = vi.fn().mockResolvedValue({ id: 'project' });
    const wrapper = mountHome(store);

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
    const wrapper = mountHome(store);
    vi.mocked(store.dispatch).mockClear();

    const button = wrapper.find('.copy-button');
    await Promise.all([button.trigger('click'), button.trigger('click')]);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    resolveCopy({ id: 'project' });
    await pendingCopy;
  });

  it('shows the structured backend reason when copying fails', async () => {
    const store = createStore({ state: { poivelle: { projects: [], discoveryWorks: works } } } as any);
    store.dispatch = vi.fn((type: string) =>
      type === 'poivelle/copyDiscoveryWork'
        ? Promise.reject({ response: { data: { detail: { message: 'Exact blueprint unavailable' } } } })
        : Promise.resolve()
    );
    const wrapper = mountHome(store);

    await wrapper.find('.copy-button').trigger('click');

    expect(ElMessage.error).toHaveBeenCalledWith('Exact blueprint unavailable');
  });
});
