// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { describe, expect, it } from 'vitest';
import FileUrlsInput from './FileUrlsInput.vue';

describe('Maestro FileUrlsInput', () => {
  it('shows and preserves existing source URLs when another file is added', async () => {
    const state = reactive({
      token: { access: 'token' },
      maestro: { config: { file_urls: ['https://example.com/source.mp4'] } }
    });
    const commits: unknown[] = [];
    const wrapper = shallowMount(FileUrlsInput, {
      global: {
        mocks: {
          $t: (key: string) => key,
          $store: {
            state,
            commit: (_type: string, payload: unknown) => commits.push(payload)
          }
        }
      }
    });

    const vm = wrapper.vm as unknown as {
      fileList: Array<{ url?: string; response?: { file_url?: string } }>;
      onChange: () => void;
    };
    expect(vm.fileList).toMatchObject([{ url: 'https://example.com/source.mp4', status: 'success' }]);

    vm.fileList.push({ response: { file_url: 'https://example.com/new.png' } });
    vm.onChange();

    expect(commits.at(-1)).toMatchObject({
      file_urls: ['https://example.com/source.mp4', 'https://example.com/new.png']
    });
  });
});
