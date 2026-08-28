// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { IChatMessageState } from '@/models';
import Message from './Message.vue';

const mountMessage = (message: Record<string, unknown>) =>
  shallowMount(Message, {
    props: { application: {}, message, messages: [message] },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { chat: {} }, getters: { site: {} } }
      },
      directives: { motion: () => undefined },
      stubs: {
        MarkdownRenderer: { props: ['content'], template: '<div class="markdown">{{ content }}</div>' }
      }
    }
  });

describe('Message partial response errors', () => {
  it('keeps streamed text visible and appends an interrupted notice', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: [{ type: 'text', text: 'Partial specification' }],
      error: { code: 'chat_error', message: 'aborted' }
    });

    expect(wrapper.text()).toContain('Partial specification');
    expect(wrapper.text()).toContain('chat.message.responseInterrupted');
    expect(wrapper.find('.partial-error').attributes('role')).toBe('alert');
    expect(wrapper.find('.error-card').exists()).toBe(false);
  });

  it.each([[''], ['   ']])('keeps the regular error card when no renderable assistant content exists', (content) => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content,
      error: { code: 'chat_error', message: 'aborted' }
    });

    expect(wrapper.find('.error-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('aborted');
    expect(wrapper.find('.partial-error').exists()).toBe(false);
  });

  it('keeps non-text partial content visible', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: [{ type: 'tool_use', tool_id: 'tool-1', tool_name: 'web_search', status: 'done', is_error: true }],
      error: { code: 'stream_interrupted', message: 'The response stream ended before completion.' }
    });

    expect(wrapper.findComponent({ name: 'ToolActivity' }).exists()).toBe(true);
    expect(wrapper.find('.partial-error').exists()).toBe(true);
    expect(wrapper.find('.error-card').exists()).toBe(false);
  });

  it('shows an actionable error after partial output instead of replacing it with generic interruption copy', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: 'Partial response',
      error: { code: 'request_entity_too_large', message: 'Request payload is too large.' }
    });

    expect(wrapper.text()).toContain('Request payload is too large.');
    expect(wrapper.text()).not.toContain('chat.message.responseInterrupted');
  });

  it('keeps a user-stopped partial response without a service error notice', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: 'Partial response'
    });

    expect(wrapper.text()).toContain('Partial response');
    expect(wrapper.find('.partial-error').exists()).toBe(false);
    expect(wrapper.find('.error-card').exists()).toBe(false);
  });
});
