// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { describe, expect, it, vi } from 'vitest';
import RecentPanel from './RecentPanel.vue';
vi.mock('@/i18n', () => ({ t: (key: string) => key }));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
function render(state: string, data: any[] = []) {
  const store = createStore({
    state: {
      acemusic: {
        tasks: { items: [{ id: 'task-1', state, response: { data }, request: { title: 'Home' } }] },
        audio: {}
      }
    }
  });
  return mount(RecentPanel, {
    global: { plugins: [store], mocks: { $t: (key: string) => key }, stubs: { ApiCodeButton: true, ElDialog: true } }
  });
}
describe('ACE Music results', () => {
  it('keeps failed tasks visible without presenting them as processing or downloadable', () => {
    const wrapper = render('failed');
    expect(wrapper.findAll('.song')).toHaveLength(2);
    expect(wrapper.text()).toContain('acemusic.state.failed');
    expect(wrapper.text()).not.toContain('acemusic.state.processing');
    expect(wrapper.text()).not.toContain('acemusic.button.download');
    wrapper.unmount();
  });
  it('makes a completed track available when the group partially failed', () => {
    const wrapper = render('partial_failed', [
      { id: 'track-1', title: 'Home', state: 'succeeded', audio_url: 'https://example.com/song.mp3' }
    ]);
    expect(wrapper.findAll('.song')).toHaveLength(2);
    expect(wrapper.text()).toContain('acemusic.state.failed');
    expect(wrapper.text()).toContain('acemusic.state.partial_failed');
    expect(wrapper.text()).toContain('acemusic.button.download');
    expect(wrapper.find('.song-cover').attributes('disabled')).toBeUndefined();
    wrapper.unmount();
  });
});
