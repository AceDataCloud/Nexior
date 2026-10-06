// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { IChatMessageContentItem } from '@/models';
import ToolActivity from './ToolActivity.vue';

const todo = (content: string, status: string, activeForm = `Doing ${content}`) => ({
  content,
  status,
  activeForm
});

const planItem = (todos: ReturnType<typeof todo>[]): IChatMessageContentItem => ({
  type: 'tool_use',
  tool_name: 'manage_todos',
  tool_display_name: 'Plan',
  status: 'done',
  input: { todos },
  output: `plan updated: ${todos.filter((item) => item.status === 'completed').length}/${todos.length} done`
});

function mountActivity(item: IChatMessageContentItem) {
  return mount(ToolActivity, {
    props: { item },
    global: {
      mocks: {
        $t: (key: string, params?: { done: number; total: number }) => {
          if (key === 'chat.plan.title') return '计划';
          if (key === 'codingBridge.transcript.todoProgress') return `已完成 ${params?.done}/${params?.total}`;
          return key;
        }
      }
    }
  });
}

describe('manage_todos activity', () => {
  it('shows a live checklist with distinct completed, active, and pending steps', async () => {
    const item = planItem([
      todo('核对文档', 'completed'),
      todo('搜索候选', 'in_progress', '正在搜索候选'),
      todo('回复 Issue', 'pending')
    ]);
    const wrapper = mountActivity(item);
    const rows = wrapper.findAll('.plan-item');

    expect(wrapper.find('.tool-header').attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('.tool-name').text()).toBe('计划');
    expect(wrapper.find('.plan-progress').text()).toBe('已完成 1/3');
    expect(rows).toHaveLength(3);
    expect(rows[0].classes()).toContain('is-completed');
    expect(rows[0].find('.plan-status-icon').exists()).toBe(true);
    expect(rows[1].classes()).toContain('is-in_progress');
    expect(rows[1].text()).toContain('正在搜索候选');
    expect(rows[2].classes()).toContain('is-pending');
    expect(rows[2].find('.plan-pending-icon').exists()).toBe(true);
    expect(rows[2].find('.plan-status-icon').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('plan updated');
    expect(wrapper.text()).not.toContain('"todos"');

    await wrapper.setProps({ item: planItem([todo('核对文档', 'completed'), todo('搜索候选', 'completed')]) });
    expect(wrapper.find('.plan-progress').text()).toBe('已完成 2/2');
    expect(wrapper.findAll('.plan-item.is-completed')).toHaveLength(2);

    await wrapper.find('.tool-header').trigger('click');
    expect(wrapper.find('.tool-header').attributes('aria-expanded')).toBe('false');
    expect(wrapper.find('.plan-list').exists()).toBe(false);
  });

  it('expands when the tool name arrives after the initial stream event', async () => {
    const wrapper = mountActivity({ type: 'tool_use', status: 'running' });
    expect(wrapper.find('.tool-header').attributes('aria-expanded')).toBe('false');

    await wrapper.setProps({ item: planItem([todo('Review', 'pending')]) });
    expect(wrapper.find('.tool-header').attributes('aria-expanded')).toBe('true');
    expect(wrapper.findAll('.plan-item')).toHaveLength(1);
  });

  it('does not flash raw JSON while the plan arguments stream in', async () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      tool_name: 'manage_todos',
      status: 'running',
      input_stream: '{"todos":[{"content":"Review"'
    });

    expect(wrapper.find('.tool-name').text()).toBe('计划');
    expect(wrapper.find('.tool-code').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('"todos"');

    await wrapper.setProps({ item: planItem([todo('Review', 'pending')]) });
    expect(wrapper.findAll('.plan-item')).toHaveLength(1);
  });

  it('keeps malformed or failed plan calls in the generic diagnostic view', () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      tool_name: 'manage_todos',
      status: 'done',
      is_error: true,
      input: { todos: [{ status: 'pending' }] },
      output: 'todos[0].content is required'
    });

    expect(wrapper.find('.plan-list').exists()).toBe(false);
    expect(wrapper.find('.tool-code').text()).toContain('"todos"');
    expect(wrapper.text()).toContain('todos[0].content is required');
  });
});
