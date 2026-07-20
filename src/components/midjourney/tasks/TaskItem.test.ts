// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IMidjourneyTask } from '@/models';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));

import TaskItem from './TaskItem.vue';

type TaskType = IMidjourneyTask['type'];
type TaskState = 'pending' | 'success' | 'failure';

const buildTask = (type: TaskType, state: TaskState): IMidjourneyTask => {
  const response =
    state === 'pending'
      ? undefined
      : type === 'describe'
        ? state === 'success'
          ? { descriptions: ['A quiet landscape'] }
          : { error: { message: 'Describe failed' } }
        : {
            success: state === 'success',
            error: state === 'failure' ? { message: 'Generation failed' } : undefined
          };

  return {
    id: `${type}-${state}`,
    type,
    created_at: 1,
    request: type === 'describe' ? { image_url: 'https://cdn.example.com/input.jpg' } : { prompt: 'Create a scene' },
    response
  } as IMidjourneyTask;
};

const mountTask = (modelValue: IMidjourneyTask) =>
  shallowMount(TaskItem, {
    props: { modelValue },
    global: {
      stubs: {
        CapabilityPresentation: true
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '' },
        $store: {
          state: {
            midjourney: {
              application: undefined,
              config: {},
              service: undefined
            }
          }
        }
      }
    }
  });

const cases = (['imagine', 'videos', 'describe'] as const).flatMap((type) =>
  (['pending', 'success', 'failure'] as const).map((state) => ({ type, state }))
);

describe('midjourney/tasks/TaskItem state spacing', () => {
  it.each(cases)('keeps $type $state state metadata separated from preceding content', ({ type, state }) => {
    const wrapper = mountTask(buildTask(type, state));
    const alert = wrapper.find('el-alert-stub');

    expect(wrapper.findAll('el-alert-stub')).toHaveLength(1);
    expect(alert.classes()).toContain('mt-2');
    expect(alert.classes()).toContain(state === 'pending' ? 'info' : state);
  });
});
