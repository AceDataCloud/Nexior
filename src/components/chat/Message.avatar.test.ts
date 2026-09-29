// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import { describe, expect, it } from 'vitest';
import { IChatMessageState, type IChatModelGroup, type ISite } from '@/models';
import Message from './Message.vue';

const group: IChatModelGroup = {
  name: 'chatgpt',
  icon: '/default-chat.png',
  models: [],
  getDisplayName: () => 'ChatGPT',
  getDescription: () => ''
};

function mountMessage(
  site: ISite = {},
  options: { modelName?: string; readonly?: boolean; role?: 'user' | 'assistant' } = {}
) {
  const state = reactive({ site, chat: options.readonly ? undefined : { modelGroup: group } });
  const wrapper = shallowMount(Message, {
    props: {
      application: {},
      message: { role: options.role ?? 'assistant', content: 'Hello', state: IChatMessageState.FINISHED },
      modelName: options.modelName ?? 'gpt-6-astra',
      readonly: options.readonly,
      modelGroupOverride: options.readonly ? group : undefined
    },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state,
          getters: {
            get site() {
              return state.site;
            }
          }
        }
      },
      directives: { motion: () => undefined }
    }
  });
  return { wrapper, state };
}

describe('assistant message avatars', () => {
  it.each([false, true])('uses the model icon ahead of the group icon (readonly=%s)', (readonly) => {
    const { wrapper } = mountMessage(
      {
        features: { chatgpt: { models: { 'gpt-6-astra': { icon_url: ' https://cdn.example.com/model.png ' } } } },
        capability_overrides: { chatgpt: { icon_url: 'https://cdn.example.com/group.png' } }
      },
      { readonly }
    );
    expect(wrapper.get('.avatar').attributes('src')).toBe('https://cdn.example.com/model.png');
  });

  it('uses the group customization when the model has no custom icon', () => {
    const { wrapper } = mountMessage({
      features: { chatgpt: { models: { 'gpt-6-astra': { display_name: 'My assistant' } } } },
      capability_overrides: { chatgpt: { icon_url: ' https://cdn.example.com/group.png ' } }
    });
    expect(wrapper.get('.avatar').attributes('src')).toBe('https://cdn.example.com/group.png');
  });

  it('keeps the default avatar when there are no overrides', () => {
    const { wrapper } = mountMessage();
    expect(wrapper.get('.avatar').attributes('src')).toBe('/default-chat.png');
  });

  it('ignores another model and another group', () => {
    const { wrapper } = mountMessage({
      features: {
        chatgpt: { models: { 'gpt-6-sol': { icon_url: 'https://cdn.example.com/other-model.png' } } },
        grok: { models: { 'gpt-6-astra': { icon_url: 'https://cdn.example.com/other-group.png' } } }
      },
      capability_overrides: { grok: { icon_url: 'https://cdn.example.com/grok.png' } }
    });
    expect(wrapper.get('.avatar').attributes('src')).toBe('/default-chat.png');
  });

  it('updates existing replies when the model icon is changed or reset', async () => {
    const { wrapper, state } = mountMessage({
      capability_overrides: { chatgpt: { icon_url: 'https://cdn.example.com/group.png' } }
    });
    state.site.features = { chatgpt: { models: { 'gpt-6-astra': { icon_url: 'https://cdn.example.com/new.png' } } } };
    await nextTick();
    expect(wrapper.get('.avatar').attributes('src')).toBe('https://cdn.example.com/new.png');
    state.site.features = { chatgpt: { models: {} } };
    await nextTick();
    expect(wrapper.get('.avatar').attributes('src')).toBe('https://cdn.example.com/group.png');
  });

  it('uses saved icons for a model no longer in the catalog', () => {
    const { wrapper } = mountMessage(
      {
        features: { chatgpt: { models: { 'retired-model': { icon_url: 'https://cdn.example.com/retired.png' } } } }
      },
      { modelName: 'retired-model', readonly: true }
    );
    expect(wrapper.get('.avatar').attributes('src')).toBe('https://cdn.example.com/retired.png');
  });

  it('does not give user messages an assistant avatar', () => {
    const { wrapper } = mountMessage({}, { role: 'user' });
    expect(wrapper.find('.avatar').exists()).toBe(false);
  });

  it('does not borrow the viewer chat group for a legacy share with an unknown model', async () => {
    const { wrapper, state } = mountMessage(
      {
        capability_overrides: { chatgpt: { icon_url: 'https://cdn.example.com/viewer.png' } }
      },
      { readonly: true, modelName: 'unknown-model' }
    );
    state.chat = { modelGroup: group };
    await wrapper.setProps({ modelGroupOverride: undefined });
    expect(wrapper.get('.avatar').attributes('src')).toBe('');
  });
});
