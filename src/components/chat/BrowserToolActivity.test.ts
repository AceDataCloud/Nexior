// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { IBrowserToolExecutionState, IChatMessageContentItem } from '@/models';
import BrowserToolActivity from './BrowserToolActivity.vue';

const STATES: IBrowserToolExecutionState[] = [
  'choose_device',
  'device_offline',
  'awaiting_device',
  'awaiting_local_approval',
  'takeover_required',
  'executing',
  'completed',
  'denied',
  'expired',
  'cancel_too_late'
];

function mountActivity(item: IChatMessageContentItem) {
  return mount(BrowserToolActivity, {
    props: { item },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { FontAwesomeIcon: true }
    }
  });
}

describe('BrowserToolActivity', () => {
  it.each(STATES)('renders durable state %s without cloud approval controls', (executionState) => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: executionState,
      tool_display_name: 'Read browser tab'
    });

    expect(wrapper.text()).toContain(`chat.browserTool.state.${executionState}`);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.emitted()).toEqual({});
  });

  it('shows only the sanitized origin from persisted content', () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: 'executing',
      origin: 'https://user:secret@example.com/private?token=hidden#fragment'
    });

    expect(wrapper.text()).toContain('https://example.com');
    expect(wrapper.text()).not.toContain('secret');
    expect(wrapper.text()).not.toContain('private');
  });
});
