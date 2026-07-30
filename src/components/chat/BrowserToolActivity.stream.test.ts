// @vitest-environment jsdom
// End-to-end-ish check over the REAL reducer + REAL component: replay the SSE
// ordering the worker actually emits (dispatch and completion share one
// execution_sequence) and assert the card reaches a terminal state and shows
// its result. Guards the two bugs fixed in #1463 from regressing together.
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { IChatMessageContentItem } from '@/models';
import { reduceBrowserToolExecution } from '@/utils/browserToolExecution';
import BrowserToolActivity from './BrowserToolActivity.vue';

function mountActivity(item: IChatMessageContentItem) {
  return mount(BrowserToolActivity, {
    props: { item },
    global: { mocks: { $t: (key: string) => key } }
  });
}

describe('browser tool card over a replayed worker stream', () => {
  it('settles on completed and reveals the result after a same-sequence finish', async () => {
    // 1. tool_use_start -> queryLoop stamps executing + sequence 1
    const item: IChatMessageContentItem = {
      type: 'tool_use',
      execution: 'browser',
      tool_name: 'browser_read_page',
      tool_display_name: 'Read page',
      status: 'running',
      input: { url: 'https://example.com' }
    };
    Object.assign(item, reduceBrowserToolExecution(item, { execution_state: 'executing', execution_sequence: 1 }));

    const wrapper = mountActivity(item);
    expect(wrapper.text()).toContain('chat.browserTool.state.executing');
    expect(wrapper.find('.is-spinning').exists()).toBe(true);

    // 2. browser_execution completion — facadeTool echoes the SAME sequence 1
    Object.assign(
      item,
      reduceBrowserToolExecution(item, {
        execution_state: 'completed',
        execution_sequence: 1,
        origin: 'https://example.com'
      })
    );
    // 3. tool_result folds in the output the same way it does for every tool
    item.status = 'done';
    item.output = 'the page said hello';
    item.duration_ms = 842;
    await wrapper.setProps({ item: { ...item } });

    // The spinner must actually stop.
    expect(wrapper.text()).toContain('chat.browserTool.state.completed');
    expect(wrapper.find('.is-spinning').exists()).toBe(false);
    expect(wrapper.text()).toContain('842ms');

    // And the result must be reachable, like any other tool card.
    await wrapper.find('.activity-header').trigger('click');
    expect(wrapper.text()).toContain('the page said hello');
  });

  it('settles on failed when a browser command throws with no metadata', async () => {
    const item: IChatMessageContentItem = {
      type: 'tool_use',
      execution: 'browser',
      tool_display_name: 'Click element',
      status: 'running'
    };
    Object.assign(item, reduceBrowserToolExecution(item, { execution_state: 'executing', execution_sequence: 2 }));
    Object.assign(item, reduceBrowserToolExecution(item, { execution_state: 'failed', execution_sequence: 2 }));
    item.status = 'done';
    item.is_error = true;
    item.output = 'element not found';

    const wrapper = mountActivity(item);
    expect(wrapper.text()).toContain('chat.browserTool.state.failed');
    expect(wrapper.find('.is-spinning').exists()).toBe(false);

    await wrapper.find('.activity-header').trigger('click');
    expect(wrapper.text()).toContain('element not found');
  });

  it('keeps a late stale event from resurrecting a settled card', async () => {
    const item: IChatMessageContentItem = { type: 'tool_use', execution: 'browser' };
    Object.assign(item, reduceBrowserToolExecution(item, { execution_state: 'executing', execution_sequence: 3 }));
    Object.assign(item, reduceBrowserToolExecution(item, { execution_state: 'completed', execution_sequence: 3 }));
    // A reordered older event must not drag it back to a spinning state.
    Object.assign(item, reduceBrowserToolExecution(item, { execution_state: 'executing', execution_sequence: 2 }));

    const wrapper = mountActivity(item);
    expect(wrapper.text()).toContain('chat.browserTool.state.completed');
    expect(wrapper.find('.is-spinning').exists()).toBe(false);
  });
});
