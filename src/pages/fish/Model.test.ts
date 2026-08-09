// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Model from './Model.vue';

const mocks = vi.hoisted(() => ({
  createModel: vi.fn(),
  ensureLoggedIn: vi.fn(() => true)
}));

vi.mock('@/operators', () => ({
  fishOperator: { createModel: mocks.createModel }
}));

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  ensureLoggedIn: mocks.ensureLoggedIn
}));

const payload = {
  title: 'My voice',
  voices: 'https://cdn.acedata.cloud/audio.mp3',
  visibility: 'private' as const,
  train_mode: 'fast' as const
};

const mountPage = (token: string | null = 'credential-token') => {
  const dispatch = vi.fn().mockResolvedValue(undefined);
  const wrapper = shallowMount(Model, {
    global: {
      provide: { initialized: false },
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: { fish: { credential: token ? { token } : undefined } },
          dispatch
        }
      }
    }
  });
  return { wrapper, dispatch };
};

const callbacks = () => ({ resolve: vi.fn(), reject: vi.fn() });

describe('fish/Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureLoggedIn.mockReturnValue(true);
    mocks.createModel.mockResolvedValue({ data: { id: 'voice-id' } });
    vi.spyOn(ElMessage, 'info').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
  });

  it('resolves after creating the model and refreshing the voice list', async () => {
    const { wrapper, dispatch } = mountPage();
    const result = callbacks();

    await (wrapper.vm as any).onCreate(payload, result);

    expect(mocks.createModel).toHaveBeenCalledWith(payload, { token: 'credential-token' });
    expect(dispatch).toHaveBeenCalledWith('fish/getVoices');
    expect(result.resolve).toHaveBeenCalledOnce();
    expect(result.reject).not.toHaveBeenCalled();
    expect((wrapper.vm as any).loading).toBe(false);
  });

  it('rejects without submitting when login is required', async () => {
    mocks.ensureLoggedIn.mockReturnValue(false);
    const { wrapper } = mountPage();
    const result = callbacks();

    await (wrapper.vm as any).onCreate(payload, result);

    expect(mocks.createModel).not.toHaveBeenCalled();
    expect(result.reject).toHaveBeenCalledOnce();
    expect(result.resolve).not.toHaveBeenCalled();
  });

  it('shows an error and rejects when the credential is unavailable', async () => {
    const { wrapper } = mountPage(null);
    const result = callbacks();

    await (wrapper.vm as any).onCreate(payload, result);

    expect(ElMessage.error).toHaveBeenCalledWith('fish.message.createModelFailed');
    expect(mocks.createModel).not.toHaveBeenCalled();
    expect(result.reject).toHaveBeenCalledOnce();
  });

  it('preserves the server error and rejects a failed request', async () => {
    const error = { response: { data: { error: { message: 'Audio is invalid' } } } };
    mocks.createModel.mockRejectedValue(error);
    const { wrapper } = mountPage();
    const result = callbacks();

    await (wrapper.vm as any).onCreate(payload, result);

    expect(ElMessage.error).toHaveBeenCalledWith('Audio is invalid');
    expect(result.reject).toHaveBeenCalledWith(error);
    expect(result.resolve).not.toHaveBeenCalled();
  });

  it('keeps the dedicated balance error when credits are exhausted', async () => {
    const error = { response: { data: { error: { code: 'used_up' } } } };
    mocks.createModel.mockRejectedValue(error);
    const { wrapper } = mountPage();
    const result = callbacks();

    await (wrapper.vm as any).onCreate(payload, result);

    expect(ElMessage.error).toHaveBeenCalledWith('fish.message.usedUp');
    expect(result.reject).toHaveBeenCalledWith(error);
  });
});
