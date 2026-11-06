// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { ISunoTask } from '@/models';
import Preview from './Preview.vue';

vi.stubGlobal('matchMedia', () => ({ matches: false }));
const mountTask = (modelValue: ISunoTask, dispatch = vi.fn(), credential?: { token: string }) => {
  const commit = vi.fn();
  return {
    commit,
    wrapper: mount(Preview, {
      props: { modelValue },
      global: {
        mocks: {
          $t: (key: string) => key,
          $store: { state: { suno: { audio: {}, config: {}, status: {}, tasks: {}, credential } }, dispatch, commit }
        },
        stubs: {
          ApiCodeDialog: true,
          ReportDialog: true,
          ElDropdown: true,
          ElTooltip: { template: '<slot />' },
          TimingDialog: true,
          VocalDialog: true,
          VoiceCreateDialog: true
        }
      }
    })
  };
};

describe('suno/task/Preview', () => {
  afterEach(() => vi.restoreAllMocks());

  it('only reports removal after server acknowledgement', async () => {
    vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as Awaited<ReturnType<typeof ElMessageBox.confirm>>);
    const success = vi.spyOn(ElMessage, 'success').mockImplementation(() => ({ close: vi.fn() }));
    let acknowledge!: () => void;
    const dispatch = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          acknowledge = resolve;
        })
    );
    const { wrapper } = mountTask(
      { id: 'task', map: () => [], response: { data: [{ id: 'a' }, { id: 'b' }] } },
      dispatch,
      { token: 'test' }
    );
    const vm = wrapper.vm as any;
    const pending = vm.onDelete({ id: 'a' });
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledWith('suno/deleteAudio', { taskId: 'task', audioId: 'a' });
    expect(success).not.toHaveBeenCalled();
    expect(wrapper.findAll('.audio')).toHaveLength(2);
    await vm.onDelete({ id: 'a' });
    expect(dispatch).toHaveBeenCalledTimes(1);
    acknowledge();
    await pending;
    expect(success).toHaveBeenCalledWith('suno.message.deleteSuccess');
    expect(vm.deletingAudioIds).toEqual([]);
  });

  it('keeps the song and shows an error when persistence fails', async () => {
    vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as Awaited<ReturnType<typeof ElMessageBox.confirm>>);
    const success = vi.spyOn(ElMessage, 'success');
    const error = vi.spyOn(ElMessage, 'error').mockImplementation(() => ({ close: vi.fn() }));
    const { wrapper } = mountTask(
      { id: 'task', map: () => [], response: { data: [{ id: 'a' }] } },
      vi.fn().mockRejectedValue(new Error('offline')),
      { token: 'test' }
    );
    await (wrapper.vm as any).onDelete({ id: 'a' });
    expect(error).toHaveBeenCalledWith('suno.message.deleteFailed');
    expect(success).not.toHaveBeenCalled();
    expect(wrapper.findAll('.audio')).toHaveLength(1);
  });

  it('does not remove a song when confirmation is cancelled', async () => {
    vi.spyOn(ElMessageBox, 'confirm').mockRejectedValue('cancel');
    const dispatch = vi.fn();
    const { wrapper } = mountTask({ id: 'task', map: () => [], response: { data: [{ id: 'a' }] } }, dispatch, {
      token: 'test'
    });
    await (wrapper.vm as any).onDelete({ id: 'a' });
    expect(dispatch).not.toHaveBeenCalled();
    expect((wrapper.vm as any).deletingAudioIds).toEqual([]);
  });
  it('keeps failed tasks in the song layout with details hidden until requested', async () => {
    const { wrapper, commit } = mountTask({
      id: 'task-1',
      map: () => [],
      request: { title: 'Autumn song', model: 'chirp-v5-5', prompt: 'Warm acoustic folk' },
      response: { success: false, data: [], error: { message: 'audio unavailable' }, trace_id: 'trace-1' }
    });
    expect(wrapper.find('.el-alert').exists()).toBe(false);
    expect(wrapper.findAll('.audio')).toHaveLength(1);
    expect(wrapper.find('.placeholder-cover').exists()).toBe(true);
    expect(wrapper.find('.title').text()).toBe('Autumn song');
    expect(wrapper.find('.model-chip').text()).toBe('v5.5');
    expect(wrapper.find('.style').text()).toBe('Warm acoustic folk');
    expect(wrapper.find('[role="status"]').text()).toBe('suno.name.failure');
    expect(wrapper.find('.play-btn').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('trace-1');
    await wrapper.find('[aria-label="suno.button.reuse_prompt"]').trigger('click');
    expect(commit).toHaveBeenCalledWith(
      'suno/setConfig',
      expect.objectContaining({ prompt: 'Warm acoustic folk', action: undefined, audio_id: undefined })
    );
  });

  it('shows an empty in-flight task as a song placeholder', () => {
    const { wrapper } = mountTask({ id: 'pending', map: () => [], request: { title: 'New song' } });
    expect(wrapper.find('.pending-cover').exists()).toBe(true);
    expect(wrapper.find('[role="status"]').text()).toBe('suno.name.generating');
    expect(wrapper.find('.failed-row').exists()).toBe(false);
  });

  it('does not mark an empty successful response as a failure', () => {
    const { wrapper } = mountTask({ id: 'empty', map: () => [], response: { success: true, data: [] } });
    expect(wrapper.find('.failed-row').exists()).toBe(false);
  });

  it('renders error-only task responses as a compact failure', () => {
    const { wrapper } = mountTask({ id: 'error', map: () => [], response: { error: 'timeout' } });
    expect(wrapper.find('.failed-row').exists()).toBe(true);
    expect(wrapper.find('.title').text()).toBe('suno.name.untitledSong');
  });

  it('keeps playable partial results', () => {
    const { wrapper } = mountTask({
      id: 'partial',
      map: () => [],
      response: {
        success: false,
        data: [{ id: 'a', audio_url: 'https://example.com/a.mp3' }],
        error: { message: 'second variation failed' }
      }
    });
    expect(wrapper.find('.failed-row').exists()).toBe(false);
    expect(wrapper.findAll('.audio')).toHaveLength(1);
    expect(wrapper.find('.play-btn').exists()).toBe(true);
  });

  it('clears incompatible references when switching to a cover', () => {
    const { wrapper, commit } = mountTask({ id: 't', map: () => [], response: { data: [] } });
    const vm = wrapper.vm as unknown as { onCover(audio: { id: string }): void };
    vm.onCover({ id: 'source' });
    expect(commit).toHaveBeenCalledWith(
      'suno/setConfig',
      expect.objectContaining({
        action: 'cover',
        audio_id: 'source',
        custom_model_id: undefined,
        mashup_audio_ids: undefined,
        replace_section_end: undefined
      })
    );
  });
});
