// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ScrollList from './ScrollList.vue';

function panel() {
  const wrapper = mount(ScrollList, { global: { stubs: { TopLoading: true } } });
  Object.defineProperty(wrapper.element, 'clientHeight', { value: 500 });
  return wrapper;
}

describe('ScrollList upward input', () => {
  it('loads on repeated upward wheel gestures while already pinned at zero', async () => {
    const wrapper = panel();
    await wrapper.trigger('wheel', { deltaY: -10 });
    await wrapper.trigger('wheel', { deltaY: -10 });
    expect(wrapper.emitted('reach-top')).toHaveLength(2);
    await wrapper.trigger('wheel', { deltaY: 10 });
    wrapper.element.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, ctrlKey: true }));
    expect(wrapper.emitted('reach-top')).toHaveLength(2);
  });

  it('supports touch and keyboard at the top even without a scroll event', async () => {
    const wrapper = panel();
    await wrapper.trigger('touchstart', { touches: [{ clientY: 100 }] });
    await wrapper.trigger('touchmove', { touches: [{ clientY: 150 }] });
    await wrapper.trigger('keydown', { key: 'PageUp' });
    expect(wrapper.emitted('reach-top')).toHaveLength(2);
  });

  it('prefetches within one viewport but does not paginate on programmatic downward anchoring', async () => {
    const wrapper = panel();
    wrapper.element.scrollTop = 600;
    await wrapper.trigger('scroll');
    expect(wrapper.emitted('reach-top')).toBeUndefined();
    wrapper.element.scrollTop = 450;
    await wrapper.trigger('scroll');
    expect(wrapper.emitted('reach-top')).toHaveLength(1);
    wrapper.element.scrollTop = 490;
    await wrapper.trigger('scroll');
    expect(wrapper.emitted('reach-top')).toHaveLength(1);
  });
});

it('rebaselines direction after replacing the history window without treating it as upward input', async () => {
  const wrapper = panel();
  wrapper.element.scrollTop = 5000;
  await wrapper.trigger('scroll');
  await wrapper.setProps({ loading: true });
  wrapper.element.scrollTop = 200;
  await wrapper.trigger('scroll');
  await wrapper.setProps({ loading: false });
  await wrapper.trigger('scroll');
  expect(wrapper.emitted('reach-top')).toBeUndefined();
  await wrapper.trigger('wheel', { deltaY: -10 });
  expect(wrapper.emitted('reach-top')).toHaveLength(1);
});
