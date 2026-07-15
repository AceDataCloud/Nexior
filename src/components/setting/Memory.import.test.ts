// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Memory from './Memory.vue';

const getProfileMock = vi.hoisted(() => vi.fn());
const importTextMock = vi.hoisted(() => vi.fn());

vi.mock('@/store/lazy', () => ({ ensureStoreModule: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/operators/memories', () => ({
  memoriesOperator: {
    getProfile: getProfileMock,
    importText: importTextMock,
    setEnabled: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }
}));
vi.mock('copy-to-clipboard', () => ({ default: vi.fn().mockResolvedValue(true) }));

const mountComponent = () =>
  shallowMount(Memory, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: { chat: { credential: { token: 'chat-token' }, memoryEnabled: true } },
          commit: vi.fn()
        }
      }
    }
  });

describe('Memory import', () => {
  beforeEach(() => {
    getProfileMock.mockReset().mockResolvedValue({ items: [], enabled: true });
    importTextMock.mockReset().mockResolvedValue({ processed: 2, rejected: 0, total: 2 });
  });

  it('imports pasted text and refreshes the cloud profile', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    const vm = wrapper.vm as unknown as {
      importText: string;
      importVisible: boolean;
      onImport: () => Promise<void>;
    };
    vm.importText = '  - Prefers concise answers.  ';
    vm.importVisible = true;

    await vm.onImport();

    expect(importTextMock).toHaveBeenCalledWith('chat-token', '- Prefers concise answers.');
    expect(getProfileMock).toHaveBeenCalledTimes(2);
    expect(vm.importVisible).toBe(false);
    expect(vm.importText).toBe('');
  });
});
