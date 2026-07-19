// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ApiCodeButton from '@/components/common/ApiCodeButton.vue';
import Preview from './Preview.vue';

describe('seedream/task/Preview', () => {
  it('disables watermarks in historical task rerun bodies', () => {
    const wrapper = shallowMount(Preview, {
      props: {
        modelValue: {
          id: 'task-1',
          request: { prompt: 'A lighthouse', watermark: true },
          response: { success: true, task_id: 'task-1', data: [] }
        }
      },
      global: {
        mocks: {
          $t: (key: string) => key,
          $dayjs: { format: () => '2026-07-19' },
          $store: { state: { seedream: { config: {} } }, commit: () => undefined }
        }
      }
    });

    expect(wrapper.findComponent(ApiCodeButton).props('body')).toMatchObject({
      prompt: 'A lighthouse',
      watermark: false,
      async: true
    });
  });

  it('adds request-context spacing only when a failed task has no prompt', () => {
    const mountFailure = (prompt?: string) =>
      shallowMount(Preview, {
        props: {
          modelValue: {
            id: 'task-1',
            request: prompt === undefined ? {} : { prompt },
            response: { success: false, task_id: 'task-1', error: { message: 'failed' } }
          }
        },
        global: {
          mocks: {
            $t: (key: string) => key,
            $dayjs: { format: () => '2026-07-19' },
            $store: { state: { seedream: { config: {} } }, commit: () => undefined }
          }
        }
      });

    expect(mountFailure().find('.content').classes()).toContain('mt-[15px]');
    expect(mountFailure('').find('.content').classes()).toContain('mt-[15px]');
    expect(mountFailure('A lighthouse').find('.content').classes()).not.toContain('mt-[15px]');
  });
});
