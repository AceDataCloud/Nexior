// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ElDatePicker } from 'element-plus';
import TaskHistoryToolbar from './TaskHistoryToolbar.vue';

const PopoverStub = {
  props: ['visible'],
  emits: ['update:visible'],
  template: `<div><div @click="$emit('update:visible', !visible)"><slot name="reference" /></div><slot v-if="visible" /></div>`
};
function toolbar(props = {}) {
  return mount(TaskHistoryToolbar, {
    props: { date: '', busy: false, hasMore: true, error: false, ...props },
    global: { mocks: { $t: (key: string) => key }, stubs: { ElDatePicker: true, ElPopover: PopoverStub } }
  });
}

describe('collapsed history menu', () => {
  it('starts with only the menu trigger and opens controls on demand', async () => {
    const wrapper = toolbar();
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(false);
    expect(wrapper.findAll('button')).toHaveLength(1);
    expect(wrapper.get('.history-menu-trigger').attributes('aria-expanded')).toBe('false');
    await wrapper.get('.history-menu-trigger').trigger('click');
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(true);
    expect(wrapper.get('.history-menu-trigger').attributes('aria-expanded')).toBe('true');
  });

  it('closes after a typed/calendar date and retains only a clearable selected-date chip', async () => {
    const wrapper = toolbar();
    await wrapper.get('.history-menu-trigger').trigger('click');
    wrapper.getComponent(ElDatePicker).vm.$emit('update:modelValue', '2026-10-11');
    await wrapper.setProps({ date: '2026-10-11' });
    expect(wrapper.emitted('date-change')).toEqual([['2026-10-11']]);
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(false);
    expect(wrapper.get('.history-date-chip').text()).toContain('2026-10-11');
    await wrapper.get('.history-date-chip').trigger('click');
    expect(wrapper.emitted('date-change')?.[1]).toEqual(['']);
  });

  it('keeps manual pagination and latest actions available inside the menu', async () => {
    const wrapper = toolbar();
    await wrapper.get('.history-menu-trigger').trigger('click');
    await wrapper.get('.history-menu-actions button:first-child').trigger('click');
    expect(wrapper.emitted('load-more')).toHaveLength(1);
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(false);
    await wrapper.get('.history-menu-trigger').trigger('click');
    await wrapper.get('.history-menu-actions button:last-child').trigger('click');
    expect(wrapper.emitted('date-change')).toEqual([['']]);
  });

  it('disables exhausted/busy actions without hiding the history status', async () => {
    const wrapper = toolbar({ date: '2026-10-11', hasMore: false });
    await wrapper.get('.history-menu-trigger').trigger('click');
    expect(wrapper.get('.history-menu-actions button:first-child').attributes('disabled')).toBeDefined();
    await wrapper.setProps({ busy: true });
    expect(wrapper.getComponent(ElDatePicker).props('disabled')).toBe(true);
    expect(wrapper.get('.history-date-chip').attributes('disabled')).toBeDefined();
    expect(wrapper.get('.history-menu-actions button:last-child').attributes('disabled')).toBeDefined();
  });

  it('opens a failed request so the retry feedback is not hidden behind the collapsed menu', async () => {
    const wrapper = toolbar();
    await wrapper.setProps({ error: true });
    expect(wrapper.get('[role="alert"]').text()).toBe('common.history.loadFailed');
    expect(wrapper.get('.history-menu-trigger').attributes('aria-expanded')).toBe('true');
    await wrapper.get('.history-menu').trigger('keydown', { key: 'Escape' });
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(false);
  });
});
