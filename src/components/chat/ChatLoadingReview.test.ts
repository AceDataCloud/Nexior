// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { loadingTools } from '@/components/loading/catalog';
import { IChatMessageState } from '@/models';
import ChatLoadingReview from './ChatLoadingReview.vue';
import Message from './Message.vue';

describe('ChatGPT review controls', () => {
  it('selects all seven renderers for the parent conversation without submitting a message', async () => {
    const wrapper = shallowMount(ChatLoadingReview, {
      props: { options: { tool: 'dot-matrix' } },
      global: { mocks: { $t: (key: string) => key } }
    });
    expect(wrapper.findAll('option')).toHaveLength(7);
    for (const { id } of loadingTools) await wrapper.get('select').setValue(id);
    expect(wrapper.emitted('selectTool')).toEqual(loadingTools.map(({ id }) => [id]));
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.emitted('restart')).toBeUndefined();
    const example = wrapper.getComponent(Message);
    expect(example.props('readonly')).toBe(true);
    expect(example.props('messages')).toEqual([]);
    expect(example.props('message').state).toBe(IChatMessageState.PENDING);
    await wrapper.get('button[aria-pressed="true"]').trigger('click');
    await wrapper.findAll('button')[3].trigger('click');
    expect(example.props('answering')).toBe(false);
    expect(example.props('message').state).toBe(IChatMessageState.FINISHED);
    wrapper.unmount();
  });
});
