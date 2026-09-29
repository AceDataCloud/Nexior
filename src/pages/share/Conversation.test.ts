// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Message from '@/components/chat/Message.vue';
import { chatOperator } from '@/operators';
import SharedConversation from './Conversation.vue';

describe('shared conversation avatars', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses the shared model and Site icon without an active chat session', async () => {
    vi.spyOn(chatOperator, 'getSharedConversation').mockResolvedValue({
      title: 'Shared conversation',
      model: 'gpt-6-astra',
      model_group: 'chatgpt',
      messages: [{ role: 'assistant', content: 'Hello' }]
    });
    const wrapper = shallowMount(SharedConversation, {
      global: {
        mocks: {
          $t: (key: string) => key,
          $route: { params: { id: 'share-1' } },
          $store: {
            state: {},
            getters: {
              site: {
                features: { chatgpt: { models: { 'gpt-6-astra': { icon_url: 'https://cdn.example.com/shared.png' } } } }
              }
            }
          }
        }
      }
    });
    await flushPromises();

    expect(wrapper.getComponent(Message).props('modelName')).toBe('gpt-6-astra');
    expect(wrapper.getComponent(Message).props('modelGroupOverride')?.name).toBe('chatgpt');
    expect(wrapper.getComponent(Message).props('readonly')).toBe(true);
    expect(wrapper.get('.meta-icon').attributes('src')).toBe('https://cdn.example.com/shared.png');
    wrapper.unmount();
  });
});
