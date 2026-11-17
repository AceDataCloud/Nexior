// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MusicTrack from './MusicTrack.vue';
const render = (playing = false) =>
  mount(MusicTrack, {
    props: { title: 'Home', playable: true, playing },
    slots: { actions: '<button class="download" @click.stop>Download</button>' },
    global: { mocks: { $t: (key: string) => key } }
  });
describe('shared music track interactions', () => {
  it('keeps selecting a row separate from pressing its native playback button', async () => {
    const wrapper = render();
    expect(wrapper.find('.play-btn').element.tagName).toBe('BUTTON');
    expect(wrapper.find('.play-btn').attributes('type')).toBe('button');
    await wrapper.find('.play-btn').trigger('click');
    expect(wrapper.emitted('play')).toHaveLength(1);
    expect(wrapper.emitted('select')).toBeUndefined();
    await wrapper.find('.audio').trigger('click');
    expect(wrapper.emitted('select')).toHaveLength(1);
    wrapper.unmount();
  });
  it('pauses a playing track without selecting it again', async () => {
    const wrapper = render(true);
    await wrapper.find('.play-btn').trigger('click');
    expect(wrapper.emitted('pause')).toHaveLength(1);
    expect(wrapper.emitted('play')).toBeUndefined();
    expect(wrapper.emitted('select')).toBeUndefined();
    wrapper.unmount();
  });
  it('keeps provider actions from also selecting or playing the row', async () => {
    const wrapper = render();
    await wrapper.find('.download').trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
    expect(wrapper.emitted('play')).toBeUndefined();
    wrapper.unmount();
  });
});
