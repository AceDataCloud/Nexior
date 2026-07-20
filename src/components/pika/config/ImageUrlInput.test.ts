// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ImageUrlInput from './ImageUrlInput.vue';

describe('Pika ImageUrlInput', () => {
  it('removes a preview URL from the request config', async () => {
    const commits: Array<{ type: string; payload: { image_url?: string[] } }> = [];
    const wrapper = shallowMount(ImageUrlInput, {
      global: {
        mocks: {
          $t: (key: string) => key,
          $store: {
            state: { token: { access: 'test' }, pika: { config: { ingredients: true } } },
            commit: (type: string, payload: { image_url?: string[] }) => commits.push({ type, payload })
          }
        }
      }
    });
    const first = { response: { file_url: 'https://cdn.example/first.png' } };
    const second = { response: { file_url: 'https://cdn.example/second.png' } };
    await wrapper.setData({ fileList: [first, second] });
    commits.length = 0;

    (wrapper.vm as any).onRemovePreview(first);

    expect(commits.at(-1)).toEqual({
      type: 'pika/setConfig',
      payload: { ingredients: true, image_url: ['https://cdn.example/second.png'] }
    });
  });
});
