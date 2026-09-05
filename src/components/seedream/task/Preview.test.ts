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

  it('uses the same spaced content container whether a failed task has a prompt or not', () => {
    const mountFailure = (prompt?: string | null) =>
      shallowMount(Preview, {
        props: {
          modelValue: {
            id: 'task-1',
            request: prompt === undefined ? {} : ({ prompt } as any),
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

    expect(mountFailure().find('.content').classes()).toEqual(['content']);
    expect(mountFailure(null).find('.content').classes()).toEqual(['content']);
    expect(mountFailure('').find('.content').classes()).toEqual(['content']);
    expect(mountFailure('A lighthouse').find('.content').classes()).toEqual(['content']);
  });
});

it('sorts and labels layer decomposition results', () => {
  const wrapper = shallowMount(Preview, {
    props: {
      modelValue: {
        id: 'layer-task',
        request: { layer_decomposition: true, image: ['input.png'] },
        response: {
          success: true,
          task_id: 'layer-task',
          data: [
            { image_url: 'top.png', z_index: 2, name: 'Title', bounding_box: { absolute: [10, 20, 100, 200] } },
            { image_url: 'base.jpg', z_index: 0, output_format: 'jpeg' }
          ]
        }
      }
    },
    global: {
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '2026-09-05' },
        $store: { state: { seedream: { config: {} } }, commit: () => undefined }
      }
    }
  });
  expect((wrapper.vm as any).images.map((image: any) => image.z_index)).toEqual([0, 2]);
  expect(wrapper.text()).toContain('seedream.name.baseLayer');
  expect(wrapper.text()).toContain('Title');
  expect(wrapper.text()).toContain('10, 20, 100, 200');
});
