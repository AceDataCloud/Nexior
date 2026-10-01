// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { IChatMessageState } from '@/models';
import Message from './Message.vue';
import AnsweringMark from './AnsweringMark.vue';
import ThinkingBlock from './ThinkingBlock.vue';

const pending = { role: 'assistant' as const, content: '', state: IChatMessageState.PENDING };
const mountMessage = () =>
  shallowMount(Message, {
    props: { application: {}, message: pending, readonly: true },
    global: {
      mocks: { $t: (key: string) => key, $store: { state: {}, getters: { site: {} } } },
      directives: { motion: () => undefined }
    }
  });
describe('assistant waiting state', () => {
  it.each([IChatMessageState.ANSWERING, IChatMessageState.FINISHED, IChatMessageState.FAILED])(
    'removes the orb after pending becomes %s',
    async (state) => {
      const wrapper = mountMessage();
      expect(wrapper.findComponent(AnsweringMark).exists()).toBe(true);
      await wrapper.setProps({ message: { ...pending, state, content: 'Reply' } });
      expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
      wrapper.unmount();
    }
  );
  it('uses one thinking indicator and completes it when answer text arrives', async () => {
    const wrapper = mountMessage();
    const reasoning = { ...pending, thinking: 'Comparing options', state: IChatMessageState.ANSWERING };
    await wrapper.setProps({ message: reasoning });
    expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
    expect(wrapper.getComponent(ThinkingBlock).props('done')).toBe(false);
    await wrapper.setProps({ message: { ...reasoning, content: 'Answer' } });
    expect(wrapper.getComponent(ThinkingBlock).props('done')).toBe(true);
    wrapper.unmount();
  });
  it('does not animate pending user messages', async () => {
    const wrapper = mountMessage();
    await wrapper.setProps({ message: { ...pending, role: 'user' } });
    expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
    wrapper.unmount();
  });
});
