// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ElDatePicker } from 'element-plus';
import TaskHistoryToolbar from './TaskHistoryToolbar.vue';

describe('history date entry', () => {
  it('handles the picker model event from typed and calendar dates without waiting for a controlled change event', async () => {
    const wrapper = mount(TaskHistoryToolbar, {
      props: { date: '', busy: false, hasMore: false, error: false },
      global: { mocks: { $t: (key: string) => key }, stubs: { ElDatePicker: true } }
    });
    wrapper.getComponent(ElDatePicker).vm.$emit('update:modelValue', '2026-10-11');
    expect(wrapper.emitted('date-change')).toEqual([['2026-10-11']]);
    expect(wrapper.findAll('button')[0].attributes('disabled')).toBeDefined();
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('date-change')?.[1]).toEqual(['']);
  });
});
