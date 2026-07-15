// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { IChatMessageState } from '@/models';
import Message from './Message.vue';

describe('Message browser tool rendering', () => {
  it('uses the read-only browser activity instead of generic tool output', () => {
    const wrapper = shallowMount(Message, {
      props: {
        application: {},
        message: {
          role: 'assistant',
          state: IChatMessageState.ANSWERING,
          content: [
            {
              type: 'tool_use',
              tool_id: 'browser-call-1',
              tool_name: 'browser_read',
              execution: 'browser',
              execution_state: 'awaiting_local_approval'
            }
          ]
        }
      },
      global: {
        mocks: {
          $t: (key: string) => key,
          $store: { state: { chat: {} }, getters: { site: {} } }
        },
        directives: { motion: () => undefined }
      }
    });

    expect(wrapper.findComponent({ name: 'BrowserToolActivity' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ToolActivity' }).exists()).toBe(false);
  });
});
