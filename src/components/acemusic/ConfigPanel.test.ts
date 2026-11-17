// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfigPanel from './ConfigPanel.vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import { acemusicOperator } from '@/operators/acemusic';
import mutations from '@/store/acemusic/mutations';
import { prepareAcemusicSubmission } from '@/utils/acemusicSubmission';
vi.mock('@/components/common/ServicePricingSummary.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/i18n', () => ({ t: (key: string) => key }));
vi.mock('@/utils', () => ({
  ensureLoggedIn: () => true,
  getConsumption: (request: any) => (request.action === 'lyrics' ? 0.1 : 2)
}));
vi.mock('@/operators/acemusic', async (original) => ({
  ...(await original<any>()),
  acemusicOperator: { lyrics: vi.fn(), task: vi.fn() }
}));
const setup = () => {
  const store = createStore({
    state: {
      site: {},
      user: { id: 'test-user' },
      acemusic: {
        application: { id: 'test-app' },
        submissions: {},
        lyricsTask: undefined as { id: string; userId: string; applicationId: string } | undefined,
        credential: { token: 'test-key' },
        service: { cost: [] },
        config: {
          model: 'acemusic-v1.1',
          custom: true,
          lyric: 'Existing lyrics',
          title: 'Existing title',
          style: 'folk'
        }
      }
    },
    mutations: {
      'acemusic/setSubmission': (state, value) => mutations.setSubmission(state.acemusic as any, value),
      'acemusic/clearSubmission': (state, value) => mutations.clearSubmission(state.acemusic as any, value),
      'acemusic/setLyricsTask': (state, value) => {
        state.acemusic.lyricsTask = value;
      },
      'acemusic/setConfig': (state, value) => {
        state.acemusic.config = value;
      }
    }
  });
  const wrapper = mount(ConfigPanel, {
    props: { submitting: false },
    global: {
      plugins: [store],
      mocks: { $t: (key: string) => key },
      stubs: {
        ServicePricingSummary: true,
        PromptTextarea: {
          name: 'PromptTextarea',
          props: ['modelValue', 'title'],
          emits: ['update:modelValue'],
          template:
            '<section><h2>{{ title }}</h2><textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"/><slot name="actions"/></section>'
        },
        ElDialog: { props: ['modelValue'], template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>' }
      }
    }
  });
  return { wrapper, store };
};
describe('ACE Music lyrics assistant', () => {
  beforeEach(() => vi.clearAllMocks());
  it('keeps the shared textareas bound to ACE draft fields without submitting', async () => {
    const { wrapper, store } = setup();
    const fields = wrapper.findAllComponents(PromptTextarea);
    fields.find((field) => field.props('title') === 'acemusic.field.prompt')!.vm.$emit('update:modelValue', 'New idea');
    fields
      .find((field) => field.props('title') === 'acemusic.field.lyric')!
      .vm.$emit('update:modelValue', 'New lyrics');
    fields.find((field) => field.props('title') === 'acemusic.field.style')!.vm.$emit('update:modelValue', 'New style');
    await flushPromises();
    expect(store.state.acemusic.config).toMatchObject({ prompt: 'New idea', lyric: 'New lyrics', style: 'New style' });
    expect(acemusicOperator.lyrics).not.toHaveBeenCalled();
    expect(wrapper.emitted('generate')).toBeUndefined();
    wrapper.unmount();
  });
  it('clears only the draft while preserving pending submissions and lyrics recovery', async () => {
    const { wrapper, store } = setup();
    prepareAcemusicSubmission(store, 'audios', { action: 'generate', model: 'acemusic-v1.1', prompt: 'Original idea' });
    prepareAcemusicSubmission(store, 'lyrics', { prompt: 'Original lyrics idea' });
    const submissions = JSON.parse(JSON.stringify(store.state.acemusic.submissions));
    store.commit('acemusic/setLyricsTask', {
      id: 'existing-lyrics-task',
      userId: 'test-user',
      applicationId: 'test-app'
    });
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'suno.button.clear_all')!
      .trigger('click');
    expect(store.state.acemusic.config).toEqual({
      model: 'acemusic-v1.1',
      custom: false,
      prompt: '',
      lyric: '',
      style: '',
      title: ''
    });
    expect(store.state.acemusic.submissions).toEqual(submissions);
    expect(store.state.acemusic.lyricsTask?.id).toBe('existing-lyrics-task');
    expect(wrapper.text()).toContain('existing-lyrics-task');
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'acemusic.button.generate')!
        .attributes('disabled')
    ).toBeDefined();
    expect(acemusicOperator.lyrics).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it('only writes lyrics on an explicit action and fills editable custom fields', async () => {
    vi.mocked(acemusicOperator.lyrics).mockResolvedValue({
      data: { success: true, data: [{ title: 'Home', text: '[Verse]\nNew lyrics' }] }
    } as any);
    const { wrapper, store } = setup();
    expect(acemusicOperator.lyrics).not.toHaveBeenCalled();
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'acemusic.button.lyrics')!
      .trigger('click');
    await wrapper.find('#acemusic-lyrics-prompt').setValue('A song about home');
    await wrapper.find('#acemusic-lyrics-style').setValue('folk');
    await wrapper
      .findAll('button')
      .filter((b) => b.text() === 'acemusic.button.lyrics')
      .at(-1)!
      .trigger('click');
    await flushPromises();
    expect(acemusicOperator.lyrics).toHaveBeenCalledWith(
      { prompt: 'A song about home', style: 'folk' },
      expect.objectContaining({ token: 'test-key', idempotencyKey: expect.any(String) })
    );
    expect(store.state.acemusic.config).toMatchObject({ custom: true, title: 'Home', lyric: '[Verse]\nNew lyrics' });
    expect(wrapper.emitted('generate')).toBeUndefined();
    wrapper.unmount();
  });
  it('recovers the original pending lyrics task without a second paid submission', async () => {
    vi.mocked(acemusicOperator.lyrics).mockResolvedValue({ data: { task_id: 'lyrics-pending' } } as any);
    vi.mocked(acemusicOperator.task).mockResolvedValue({
      data: {
        state: 'succeeded',
        response: { success: true, data: [{ title: 'Recovered', text: 'Recovered lyrics' }] }
      }
    } as any);
    const { wrapper, store } = setup();
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'acemusic.button.lyrics')!
      .trigger('click');
    await wrapper.find('#acemusic-lyrics-prompt').setValue('Home');
    await wrapper
      .findAll('button')
      .filter((b) => b.text() === 'acemusic.button.lyrics')
      .at(-1)!
      .trigger('click');
    await flushPromises();
    expect(store.state.acemusic.lyricsTask).toEqual({
      id: 'lyrics-pending',
      userId: 'test-user',
      applicationId: 'test-app'
    });
    expect(wrapper.text()).toContain('lyrics-pending');
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'acemusic.button.checkLyrics')!
      .trigger('click');
    await flushPromises();
    expect(acemusicOperator.task).toHaveBeenCalledWith('lyrics-pending', { token: 'test-key' });
    expect(acemusicOperator.lyrics).toHaveBeenCalledTimes(1);
    expect(store.state.acemusic.lyricsTask).toBeUndefined();
    expect(store.state.acemusic.config.lyric).toBe('Recovered lyrics');
    wrapper.unmount();
  });
  it('resubmits a lost lyrics response with the same idempotency key and original body', async () => {
    vi.mocked(acemusicOperator.lyrics).mockRejectedValueOnce(new Error('Connection lost'));
    const { wrapper } = setup();
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'acemusic.button.lyrics')!
      .trigger('click');
    await wrapper.find('#acemusic-lyrics-prompt').setValue('Original lyrics idea');
    await wrapper
      .findAll('button')
      .filter((b) => b.text() === 'acemusic.button.lyrics')
      .at(-1)!
      .trigger('click');
    await flushPromises();
    const originalCall = vi.mocked(acemusicOperator.lyrics).mock.calls[0];
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'acemusic.button.lyrics')!
      .trigger('click');
    await wrapper.find('#acemusic-lyrics-prompt').setValue('Changed idea after disconnect');
    vi.mocked(acemusicOperator.lyrics).mockResolvedValueOnce({
      data: { success: true, task_id: 'recovered-task', data: [{ title: 'Recovered', text: 'Original result' }] }
    } as any);
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'acemusic.button.recoverLyrics')!
      .trigger('click');
    await flushPromises();
    expect(vi.mocked(acemusicOperator.lyrics).mock.calls[1]).toEqual(originalCall);
    expect(originalCall[1]).toMatchObject({ idempotencyKey: expect.any(String) });
    expect(wrapper.text()).not.toContain('acemusic.button.recoverLyrics');
    wrapper.unmount();
  });
});
