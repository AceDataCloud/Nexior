// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  isMainOfficial: () => true
}));

import ApiCodeButton from './ApiCodeButton.vue';

const mountButton = (path: string, credentials: Record<string, string>) =>
  shallowMount(ApiCodeButton, {
    props: { path },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: Object.fromEntries(
            Object.entries(credentials).map(([store, token]) => [store, { credential: { token } }])
          )
        }
      }
    }
  });

describe('common/ApiCodeButton', () => {
  // The store key is derived from the first path segment, which is hyphenated
  // for some services while the Vuex module name never is.
  it.each([
    ['/digital-human/videos', 'digitalhuman'],
    ['/nano-banana/images', 'nanobanana'],
    ['/seedance/videos', 'seedance'],
    ['/openai/images/generations', 'openaiimage']
  ])('resolves the credential for %s from the %s store', (path, store) => {
    expect(mountButton(path, { [store]: 'token-abc' }).vm.resolvedToken).toBe('token-abc');
  });

  it('resolves an empty token for an unmapped path instead of throwing', () => {
    expect(mountButton('/not-a-service/x', { seedance: 'token-abc' }).vm.resolvedToken).toBe('');
  });
});
