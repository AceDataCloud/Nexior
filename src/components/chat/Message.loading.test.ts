// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { IChatMessageState, type IChatMessage } from '@/models';
import { loadingTools } from '@/components/loading/catalog';
import Message from './Message.vue';
import AnsweringMark from './AnsweringMark.vue';

function mountMessage(
  message: IChatMessage,
  answering = true,
  tool = 'dot-matrix' as (typeof loadingTools)[number]['id']
) {
  return shallowMount(Message, {
    props: { message, application: {}, answering, loadingOptions: { tool, size: 28 } },
    global: {
      mocks: { $t: (key: string) => key, $store: { state: { chat: {} }, getters: { site: {} } } },
      directives: { motion: () => undefined }
    }
  });
}

describe('real chat loading lifecycle', () => {
  it.each(loadingTools)('uses $id for pending and streamed answers, then removes it on completion', async ({ id }) => {
    const wrapper = mountMessage({ role: 'assistant', content: '', state: IChatMessageState.PENDING }, true, id);
    expect(wrapper.getComponent(AnsweringMark).props()).toMatchObject({
      loadingOptions: { tool: id },
      stage: 'waiting'
    });
    await wrapper.setProps({
      message: { role: 'assistant', content: '', thinking: 'Reasoning', state: IChatMessageState.ANSWERING }
    });
    expect(wrapper.getComponent(AnsweringMark).props('stage')).toBe('reasoning');
    await wrapper.setProps({
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: 'Partial answer' }],
        state: IChatMessageState.ANSWERING
      }
    });
    expect(wrapper.getComponent(AnsweringMark).props('stage')).toBe('replying');
    await wrapper.setProps({
      message: { role: 'assistant', content: 'Finished answer', state: IChatMessageState.FINISHED }
    });
    expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
  });

  it.each([IChatMessageState.PENDING, IChatMessageState.ANSWERING])(
    'removes the indicator immediately on Stop (%s)',
    async (state) => {
      const wrapper = mountMessage({ role: 'assistant', content: 'Partial answer', state });
      expect(wrapper.findComponent(AnsweringMark).exists()).toBe(true);
      await wrapper.setProps({ answering: false });
      expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
      expect(wrapper.vm.copyableText).toBe('Partial answer');
    }
  );

  it('preserves partial output and error recovery while ending animation', async () => {
    const wrapper = mountMessage({ role: 'assistant', content: 'Partial answer', state: IChatMessageState.ANSWERING });
    await wrapper.setProps({
      message: {
        role: 'assistant',
        content: 'Partial answer',
        state: IChatMessageState.FAILED,
        error: { code: 'stream_interrupted', message: 'aborted' }
      }
    });
    expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
    expect(wrapper.vm.copyableText).toBe('Partial answer');
    expect(wrapper.find('.partial-error').exists()).toBe(true);
  });

  it.each(['ask_user_question', 'request_user_consent', 'request_action_confirmation'])(
    'ends animation for %s, resumes after the answer',
    async (tool_name) => {
      const wrapper = mountMessage({
        role: 'assistant',
        state: IChatMessageState.ANSWERING,
        content: [{ type: 'tool_use', tool_name, status: 'awaiting_input' }]
      });
      expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
      await wrapper.setProps({
        message: {
          role: 'assistant',
          state: IChatMessageState.ANSWERING,
          content: [{ type: 'tool_use', tool_name, status: 'done' }]
        }
      });
      expect(wrapper.findComponent(AnsweringMark).exists()).toBe(true);
    }
  );

  it('does not animate a user message or a restored inactive assistant', () => {
    expect(mountMessage({ role: 'user', state: IChatMessageState.PENDING }).findComponent(AnsweringMark).exists()).toBe(
      false
    );
    expect(
      mountMessage({ role: 'assistant', state: IChatMessageState.ANSWERING }, false)
        .findComponent(AnsweringMark)
        .exists()
    ).toBe(false);
  });

  it('does not animate an older nonterminal message while a new reply is active', async () => {
    const previous: IChatMessage = {
      role: 'assistant',
      state: IChatMessageState.ANSWERING,
      content: 'Old partial answer'
    };
    const wrapper = mountMessage(previous);
    await wrapper.setProps({ messages: [previous, { role: 'assistant', state: IChatMessageState.PENDING }] });
    expect(wrapper.findComponent(AnsweringMark).exists()).toBe(false);
  });
});
