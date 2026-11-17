// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { describe, expect, it, vi } from 'vitest';
import RecentPanel from './RecentPanel.vue';
vi.mock('@/i18n', () => ({ t: (key: string) => key }));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
function render(state: string, data: any[] = []) {
  const dispatch = vi.fn();
  const store = createStore({
    state: {
      acemusic: {
        credential: {},
        tasks: { items: [{ id: 'task-1', state, response: { data }, request: { title: 'Home' } }] },
        audio: {}
      }
    },
    actions: { 'acemusic/setAudio': (_, audio) => dispatch(audio) }
  });
  const wrapper = mount(RecentPanel, {
    global: {
      plugins: [store],
      mocks: { $t: (key: string) => key },
      stubs: { ApiCodeDialog: true, ElDialog: true, Player: true }
    }
  });
  return { wrapper, dispatch };
}
describe('ACE Music results', () => {
  it('keeps failed candidates visible without presenting them as processing or downloadable', () => {
    const { wrapper } = render('failed');
    expect(wrapper.findAll('.audio')).toHaveLength(2);
    expect(wrapper.text()).toContain('acemusic.state.failed');
    expect(wrapper.text()).not.toContain('acemusic.state.processing');
    expect(wrapper.find('[aria-label="acemusic.button.download"]').exists()).toBe(false);
    expect(wrapper.find('.play-btn').exists()).toBe(false);
    wrapper.unmount();
  });
  it('preserves both candidates and the group warning when only one track is delivered', () => {
    const { wrapper, dispatch } = render('partial_failed', [
      { id: 'track-1', title: 'Home', state: 'succeeded', audio_url: 'https://example.com/song.mp3' }
    ]);
    expect(wrapper.findAll('.audio')).toHaveLength(2);
    expect(wrapper.text()).toContain('acemusic.state.failed');
    expect(wrapper.text()).toContain('acemusic.state.partial_failed');
    expect(wrapper.findAll('[aria-label="acemusic.button.download"]')).toHaveLength(1);
    expect(wrapper.findAll('.play-btn')).toHaveLength(1);
    wrapper.find('.play-btn').trigger('click');
    expect(dispatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'track-1', state: 'playing' }));
    wrapper.unmount();
  });
  it('does not turn submission-unknown candidates into a loading or playable result', () => {
    const { wrapper } = render('submission_unknown');
    expect(wrapper.text()).toContain('acemusic.state.submission_unknown');
    expect(wrapper.find('.generating').exists()).toBe(false);
    expect(wrapper.find('.play-btn').exists()).toBe(false);
    wrapper.unmount();
  });
});
