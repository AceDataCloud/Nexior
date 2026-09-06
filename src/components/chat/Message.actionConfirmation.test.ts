// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { IChatMessageState, type IChatMessage } from '@/models';
import Message from './Message.vue';

const pendingMessage: IChatMessage = {
  role: 'assistant',
  state: IChatMessageState.ANSWERING,
  content: [
    {
      type: 'tool_use',
      tool_id: 'act-tool-1',
      tool_name: 'request_action_confirmation',
      status: 'awaiting_input',
      pending_action_confirmation: {
        action_confirmation_id: 'actconf_1',
        kind: 'tiktok.upload_draft',
        title: 'Upload to TikTok drafts',
        preview: { type: 'video', url: 'https://cdn.example.com/video.mp4' }
      }
    }
  ]
};

const mountMessage = (readonly: boolean) =>
  shallowMount(Message, {
    props: { application: {}, message: pendingMessage, readonly },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { chat: {} }, getters: { site: {} } }
      },
      directives: { motion: () => undefined }
    }
  });

describe('Message action confirmation rendering', () => {
  it('renders a pending action confirmation in an interactive conversation', () => {
    expect(mountMessage(false).findComponent({ name: 'ActionConfirmationCard' }).exists()).toBe(true);
  });

  it('does not render actionable confirmation controls in readonly conversations', () => {
    const wrapper = mountMessage(true);
    expect(wrapper.findComponent({ name: 'ActionConfirmationCard' }).exists()).toBe(false);
    expect(wrapper.emitted('respondActionConfirmation')).toBeUndefined();
  });
});
