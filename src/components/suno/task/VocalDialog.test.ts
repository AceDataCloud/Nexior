// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createStore } from 'vuex';
import { ElButton, ElInputNumber, ElInput } from 'element-plus';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import VocalDialog from './VocalDialog.vue';
const api = vi.hoisted(() => ({ vox: vi.fn(), persona: vi.fn() }));
vi.mock('@/operators/suno', () => ({ sunoOperator: api }));
vi.mock('@/utils/x402/sunoPayment', () => ({ sunoPaymentOptions: () => ({ token: 'fixture-token' }) }));
const mountDialog = () => {
  const refresh = vi.fn();
  const store = createStore({ state: { suno: {} }, actions: { 'suno/getPersonas': refresh } });
  const wrapper = mount(VocalDialog, {
    props: { modelValue: true, audio: { id: 'source', title: 'My song', duration: 60 } },
    global: {
      plugins: [store, createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false })],
      stubs: { ElDialog: { template: '<div><slot /><slot name="footer" /></div>' } }
    }
  });
  return { wrapper, refresh };
};
const button = (wrapper: ReturnType<typeof mountDialog>['wrapper'], key: string) =>
  wrapper.findAllComponents(ElButton).find((b) => b.text() === key)!;
beforeEach(() => {
  vi.clearAllMocks();
  api.vox.mockResolvedValue({
    data: { success: true, data: { id: 'vox', vocal_audio_url: 'https://example.com/voice.mp3' } }
  });
  api.persona.mockResolvedValue({ data: { success: true, data: { persona_id: 'persona' } } });
});
describe('vocal reference workflow', () => {
  it('extracts a bounded excerpt, previews it and saves the extracted range as a persona', async () => {
    const { wrapper, refresh } = mountDialog();
    await button(wrapper, 'suno.button.extract_vocals').trigger('click');
    await flushPromises();
    expect(api.vox).toHaveBeenCalledWith(
      { audio_id: 'source', vocal_start: 0, vocal_end: 20 },
      { token: 'fixture-token' }
    );
    expect(wrapper.find('audio').attributes('src')).toBe('https://example.com/voice.mp3');
    // Changing the form after extraction must not change the saved voice's range.
    wrapper.findAllComponents(ElInputNumber)[1].vm.$emit('update:modelValue', 25);
    wrapper.findAllComponents(ElInput).at(-1)!.vm.$emit('update:modelValue', 'My voice');
    await flushPromises();
    await button(wrapper, 'suno.button.create_persona').trigger('click');
    await flushPromises();
    expect(api.persona).toHaveBeenCalledWith(
      { audio_id: 'source', vox_audio_id: 'vox', name: 'My voice', vocal_start: 0, vocal_end: 20 },
      { token: 'fixture-token' }
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('prevents a 30-second extraction before any API call', async () => {
    const { wrapper } = mountDialog();
    wrapper.findAllComponents(ElInputNumber)[1].vm.$emit('update:modelValue', 30);
    await flushPromises();
    expect(button(wrapper, 'suno.button.extract_vocals').props('disabled')).toBe(true);
    expect(api.vox).not.toHaveBeenCalled();
  });
  it('does not show a successful preview for a failed extraction response', async () => {
    api.vox.mockResolvedValue({ data: { success: false, data: {} } });
    const { wrapper } = mountDialog();
    await button(wrapper, 'suno.button.extract_vocals').trigger('click');
    await flushPromises();
    expect(wrapper.find('audio').exists()).toBe(false);
    expect(api.persona).not.toHaveBeenCalled();
  });
});
