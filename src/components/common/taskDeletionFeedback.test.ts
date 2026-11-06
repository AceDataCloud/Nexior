// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { computed, defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import { createStore } from 'vuex';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTaskActions } from '@/store/factories/createTaskActions';
import SunoPreview from '@/components/suno/task/Preview.vue';
import ImagePreview from '@/components/openaiimage/task/Preview.vue';

const feedback = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), confirm: vi.fn() }));
vi.mock('element-plus', async (original) => ({
  ...(await original<typeof import('element-plus')>()),
  ElMessageBox: { confirm: feedback.confirm },
  ElMessage: { success: feedback.success, error: feedback.error }
}));
vi.stubGlobal('matchMedia', () => ({ matches: false }));

describe.each([
  ['suno', SunoPreview],
  ['openaiimage', ImagePreview]
] as const)('%s task feedback after unmount', (service, Preview) => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedback.confirm.mockResolvedValue(undefined);
  });

  it.each(['success', 'failure'])('keeps %s feedback when optimistic deletion unmounts the card', async (outcome) => {
    let resolve!: (value: any) => void;
    let reject!: (error: Error) => void;
    const pending = new Promise((ok, fail) => {
      resolve = ok;
      reject = fail;
    });
    const task = {
      id: 'task-1',
      response: { success: true, data: [{ id: 'audio-1', url: 'https://example.test/a.png' }] }
    };
    const actions = createTaskActions({
      serviceId: 'service',
      operator: { tasks: vi.fn(), delete: vi.fn(() => pending) as any }
    });
    const store = createStore<any>({
      state: { user: { id: 'user' } },
      modules: {
        [service]: {
          namespaced: true,
          state: {
            config: {},
            status: {},
            credential: { token: 'test' },
            audio: { id: 'audio-1' },
            tasks: { items: [task], total: 1 }
          },
          actions: { ...actions, setAudio: ({ commit }: any, audio: any) => commit('setAudio', audio) },
          mutations: {
            setTasksItems: (state: any, items: any[]) => {
              state.tasks.items = items;
            },
            setTasksTotal: (state: any, total: number) => {
              state.tasks.total = total;
            },
            setAudio: (state: any, audio: any) => {
              state.audio = audio;
            }
          }
        }
      }
    });
    // Match production: legacy vue-i18n removes instance.$t on unmount.
    const i18n = createI18n({
      legacy: true,
      locale: 'en',
      missingWarn: false,
      fallbackWarn: false,
      messages: {
        en: { common: { message: { deleteTaskSuccess: 'Record deleted.', deleteTaskFailed: 'Deletion failed.' } } }
      }
    });
    const errors: unknown[] = [];
    const parent = defineComponent({
      components: { TaskPreview: Preview },
      setup: () => ({ tasks: computed(() => store.state[service].tasks.items) }),
      template: '<TaskPreview v-for="task in tasks" :key="task.id" :model-value="task" />'
    });
    const wrapper = mount(parent, {
      global: {
        plugins: [store, i18n],
        config: {
          errorHandler: (error) => {
            errors.push(error);
          }
        },
        mocks: { $dayjs: { format: () => '' } },
        stubs: {
          CapabilityPresentation: true,
          ImageWrapper: true,
          ApiCodeDialog: true,
          ReportDialog: true,
          ElDropdown: true,
          ElTooltip: { template: '<slot />' },
          TimingDialog: true,
          VocalDialog: true,
          VoiceCreateDialog: true
        }
      }
    });
    await wrapper.find('.btn-delete').trigger('click');
    await flushPromises();
    expect(wrapper.findComponent(Preview).exists()).toBe(false);
    if (outcome === 'success') resolve({ data: { id: task.id, deleted: true } });
    else reject(new Error('offline'));
    await flushPromises();
    expect(errors).toEqual([]);
    expect(outcome === 'success' ? feedback.success : feedback.error).toHaveBeenCalledWith(
      outcome === 'success' ? 'Record deleted.' : 'Deletion failed.'
    );
    expect(store.state[service].tasks.items).toHaveLength(outcome === 'success' ? 0 : 1);
    if (service === 'suno') expect(store.state.suno.audio).toEqual(outcome === 'success' ? null : { id: 'audio-1' });
    wrapper.unmount();
  });
});
