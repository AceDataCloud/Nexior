// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { IChatMessageContentItem } from '@/models';
import ToolActivity from './ToolActivity.vue';

function mountActivity(item: IChatMessageContentItem, turnActive = true) {
  return mount(ToolActivity, {
    props: { item, turnActive },
    global: {
      // el-icon is auto-imported globally in the app; stub it so a bare mount
      // renders. We assert on the root state classes + label, not the glyph.
      stubs: { 'el-icon': true },
      mocks: { $t: (key: string) => key }
    }
  });
}

const runningItem: IChatMessageContentItem = {
  type: 'tool_use',
  tool_name: 'bash',
  tool_display_name: 'Bash',
  status: 'running',
  input: {}
};

describe('ToolActivity status icon', () => {
  it('spins only while the tool is running on a live turn', () => {
    const wrapper = mountActivity(runningItem, true);
    expect(wrapper.classes()).toContain('is-running');
    expect(wrapper.classes()).not.toContain('is-error');
    expect(wrapper.text()).not.toContain('chat.toolActivity.interrupted');
  });

  it('settles a running block to interrupted (error) once the turn has ended', () => {
    const wrapper = mountActivity(runningItem, false);
    // No eternal spinner: the running state is dropped once the turn is over.
    expect(wrapper.classes()).not.toContain('is-running');
    // A never-resolved tool is shown as failed, and labeled interrupted.
    expect(wrapper.classes()).toContain('is-error');
    expect(wrapper.text()).toContain('chat.toolActivity.interrupted');
  });

  it('renders an explicit error as error regardless of turn state', () => {
    const wrapper = mountActivity(
      { type: 'tool_use', tool_name: 'bash', status: 'done', is_error: true, output: 'boom', input: {} },
      false
    );
    expect(wrapper.classes()).toContain('is-error');
    expect(wrapper.classes()).not.toContain('is-running');
    // A real done+error block is not an interruption.
    expect(wrapper.text()).not.toContain('chat.toolActivity.interrupted');
  });

  it('leaves an awaiting_input block un-interrupted even after the turn ends', () => {
    // A deferred desktop client tool sits at 'awaiting_input' (not 'running'),
    // so it must NOT be marked error/interrupted when turnActive is false.
    const wrapper = mountActivity({ type: 'tool_use', tool_name: 'bash', status: 'awaiting_input', input: {} }, false);
    expect(wrapper.classes()).not.toContain('is-running');
    expect(wrapper.classes()).not.toContain('is-error');
    expect(wrapper.text()).not.toContain('chat.toolActivity.interrupted');
  });

  it('renders a completed success without spinner or error', () => {
    const wrapper = mountActivity(
      {
        type: 'tool_use',
        tool_name: 'bash',
        status: 'done',
        is_error: false,
        output: 'ok',
        duration_ms: 42,
        input: {}
      },
      false
    );
    expect(wrapper.classes()).not.toContain('is-running');
    expect(wrapper.classes()).not.toContain('is-error');
    expect(wrapper.text()).toContain('42ms');
  });
});
