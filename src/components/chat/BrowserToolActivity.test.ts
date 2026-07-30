// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { IBrowserToolExecutionState, IChatMessageContentItem } from '@/models';
import BrowserToolActivity from './BrowserToolActivity.vue';

const STATES: IBrowserToolExecutionState[] = [
  'starting_session',
  'attaching_tab',
  'ready',
  'executing',
  'completed',
  'device_offline',
  'device_busy',
  'authorization_required',
  'stopped',
  'expired',
  'debugger_unavailable',
  'unknown_outcome',
  'failed'
];

function mountActivity(item: IChatMessageContentItem) {
  return mount(BrowserToolActivity, {
    props: { item },
    global: {
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('BrowserToolActivity', () => {
  it.each(STATES)('renders durable state %s', (executionState) => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: executionState,
      tool_display_name: 'Read browser tab'
    });

    expect(wrapper.text()).toContain(`chat.browserTool.state.${executionState}`);
  });

  it('stops an active browser session', async () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: 'executing',
      browser_session_id: 'session-1'
    });
    await wrapper.find('.activity-actions button').trigger('click');
    expect(wrapper.emitted('stop-session')).toEqual([['session-1']]);
  });

  it.each([
    ['device_offline', 'open-device-manager'],
    ['device_busy', 'stop-other-session'],
    ['debugger_unavailable', 'close-devtools'],
    ['authorization_required', 'open-consent-card']
  ] as const)('emits recovery action for %s', async (executionState, action) => {
    const wrapper = mountActivity({ type: 'tool_use', execution: 'browser', execution_state: executionState });
    await wrapper.find('.activity-actions button').trigger('click');
    expect(wrapper.emitted('recovery')).toEqual([[action]]);
  });

  it('shows only the sanitized origin from persisted content', () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: 'executing',
      origin: 'https://user:secret@example.com/private?token=hidden#fragment'
    });

    expect(wrapper.text()).toContain('example.com');
    expect(wrapper.text()).not.toContain('https://');
    expect(wrapper.text()).not.toContain('secret');
    expect(wrapper.text()).not.toContain('private');
  });

  it('reveals input and output only once expanded', async () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: 'completed',
      tool_display_name: 'Read page',
      input: { url: 'https://example.com' },
      output: 'page body text',
      duration_ms: 1234
    });

    expect(wrapper.find('.activity-body').exists()).toBe(false);
    expect(wrapper.text()).toContain('1234ms');

    await wrapper.find('.activity-header').trigger('click');

    expect(wrapper.text()).toContain('page body text');
    expect(wrapper.text()).toContain('https://example.com');
  });

  it('falls back to streaming args while the input is still arriving', async () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: 'executing',
      input_stream: '{"url":"https://partial'
    });

    await wrapper.find('.activity-header').trigger('click');

    expect(wrapper.text()).toContain('https://partial');
  });

  it('keeps action buttons from toggling the panel', async () => {
    const wrapper = mountActivity({
      type: 'tool_use',
      execution: 'browser',
      execution_state: 'executing',
      browser_session_id: 'session-1',
      output: 'should stay hidden'
    });

    await wrapper.find('.activity-actions button').trigger('click');

    expect(wrapper.emitted('stop-session')).toEqual([['session-1']]);
    expect(wrapper.find('.activity-body').exists()).toBe(false);
  });
});
