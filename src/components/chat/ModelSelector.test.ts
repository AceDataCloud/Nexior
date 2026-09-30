// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { nextTick, reactive, toRaw } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import ModelSelector from './ModelSelector.vue';
import {
  CHAT_MODEL_GPT_5_6_SOL,
  CHAT_MODEL_GPT_6_ASTRA,
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_GEMINI
} from '@/constants';
import type { IChatModel } from '@/models';

const persistedModel = (model: IChatModel): IChatModel => JSON.parse(JSON.stringify(model));

function mountSelector(model: IChatModel | undefined, modelGroup = CHAT_MODEL_GROUP_CHATGPT, site?: unknown) {
  const state = reactive({
    chat: {
      model,
      modelGroup
    }
  });
  const dispatch = vi.fn((action: string, payload: unknown) => {
    if (action === 'chat/setModel') state.chat.model = payload as IChatModel;
    if (action === 'chat/setModelGroup') state.chat.modelGroup = payload as typeof modelGroup;
  });
  const wrapper = shallowMount(ModelSelector, {
    global: {
      mocks: {
        $route: { meta: { modelGroup } },
        $store: { state, dispatch, getters: { site } },
        $t: (key: string) => key
      },
      stubs: {
        ElDropdown: { template: '<div><slot /><slot name="dropdown" /></div>' },
        ElDropdownMenu: { template: '<div><slot /></div>' },
        ElDropdownItem: { template: '<div><slot /></div>' },
        ConfirmIcon: true,
        ExpandDownIcon: true
      }
    }
  });
  return { dispatch, state, wrapper };
}

describe('ModelSelector', () => {
  it('restores a persisted selection to its canonical model object', async () => {
    const { dispatch, state, wrapper } = mountSelector(persistedModel(CHAT_MODEL_GPT_5_6_SOL));
    await nextTick();

    expect(dispatch).toHaveBeenCalledWith('chat/setModel', CHAT_MODEL_GPT_5_6_SOL);
    expect(toRaw(state.chat.model)).toBe(CHAT_MODEL_GPT_5_6_SOL);
    expect(toRaw(state.chat.model)).not.toBe(CHAT_MODEL_GPT_6_ASTRA);
    expect(wrapper.find('.trigger-name').text()).toBe(CHAT_MODEL_GPT_5_6_SOL.getDisplayName());
  });

  it('shows the Site icon for the selected model and dropdown without changing the model ID', async () => {
    const icon = 'https://example.com/my-model.png';
    const { state, wrapper } = mountSelector(CHAT_MODEL_GPT_5_6_SOL, CHAT_MODEL_GROUP_CHATGPT, {
      features: { chatgpt: { models: { [CHAT_MODEL_GPT_5_6_SOL.name]: { icon_url: icon } } } }
    });
    await nextTick();
    expect(wrapper.find('.trigger-icon').attributes('src')).toBe(icon);
    expect(wrapper.findAll('.item-icon').some((item) => item.attributes('src') === icon)).toBe(true);
    expect(state.chat.model?.name).toBe(CHAT_MODEL_GPT_5_6_SOL.name);
  });

  it('preserves the selected model when the same route group is rebound', async () => {
    const { dispatch, wrapper } = mountSelector(CHAT_MODEL_GPT_5_6_SOL);
    dispatch.mockClear();

    await (wrapper.vm as any).$options.watch.modelGroup.call(wrapper.vm, { ...CHAT_MODEL_GROUP_CHATGPT });

    expect(dispatch).toHaveBeenCalledWith('chat/setModel', CHAT_MODEL_GPT_5_6_SOL);
  });

  it.each([
    ['missing', undefined],
    ['unknown', { ...persistedModel(CHAT_MODEL_GPT_5_6_SOL), name: 'removed-model' }],
    ['another group', persistedModel(CHAT_MODEL_GROUP_GEMINI.models[0])]
  ])('falls back to the route default for a %s persisted model', async (_label, model) => {
    const { dispatch, state } = mountSelector(model as IChatModel | undefined);
    await nextTick();

    expect(dispatch).toHaveBeenCalledWith('chat/setModel', CHAT_MODEL_GPT_6_ASTRA);
    expect(toRaw(state.chat.model)).toBe(CHAT_MODEL_GPT_6_ASTRA);
  });
});

it('lets a model selection reach the backend even with a stale denied eligibility snapshot', () => {
  const { wrapper, state, dispatch } = mountSelector(undefined);
  const target = CHAT_MODEL_GROUP_CHATGPT.models[1];
  Object.assign(state.chat, { modelAccess: { [target.name]: { allowed: false, restricted: true } } });
  wrapper.vm.onModelChange(target);
  expect(dispatch).toHaveBeenCalledWith('chat/setModel', target);
  expect(wrapper.emitted('model-changed')).toEqual([[target]]);
  expect(dispatch).not.toHaveBeenCalledWith('chat/refreshModelAccess');
});
