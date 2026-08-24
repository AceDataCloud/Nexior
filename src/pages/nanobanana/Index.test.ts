// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Status } from '@/models';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  ensureLoggedIn: vi.fn(() => true),
  ensureNoPendingUpload: vi.fn(() => true),
  instrument: vi.fn((_: string, operation: Promise<unknown>) => operation),
  resolveWallet: vi.fn(() => ({ address: 'wallet' })),
  walletMode: false
}));

vi.mock('@/operators', () => ({ nanobananaOperator: { generate: mocks.generate } }));
vi.mock('@/plugins/telemetry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/plugins/telemetry')>()),
  instrumentGeneration: mocks.instrument
}));
vi.mock('@/utils/showcaseRecreateMixin', () => ({ showcaseRecreateMixin: () => ({}) }));
vi.mock('@/utils/quotaExhausted', () => ({ showQuotaExhausted: vi.fn(() => false) }));
vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => true,
  scenarioPaymentState: () => ({ mode: mocks.walletMode ? 'wallet' : 'credits' })
}));
vi.mock('@/operators/x402', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/operators/x402')>()),
  resolveX402WalletContext: mocks.resolveWallet
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  ensureLoggedIn: mocks.ensureLoggedIn,
  ensureNoPendingUpload: mocks.ensureNoPendingUpload,
  uploadTrackerProviderMixin: {}
}));

import NanobananaIndex from './Index.vue';

const mountPage = (prompt: string | undefined, imageUrls?: string[]) =>
  shallowMount(NanobananaIndex, {
    global: {
      provide: { initialized: false },
      mocks: {
        $t: (key: string) => key,
        $wallet: {},
        $route: { query: {} },
        $router: { replace: vi.fn() },
        $store: {
          state: {
            nanobanana: {
              credential: { token: 'credential-token' },
              config: { model: 'nano-banana', prompt, image_urls: imageUrls },
              status: { getApplications: Status.Success, getTasks: Status.Success }
            }
          },
          dispatch: vi.fn().mockResolvedValue([]),
          commit: vi.fn()
        }
      },
      stubs: {
        Layout: { template: '<main><slot name="config" /><slot name="result" /></main>' },
        ConfigPanel: true,
        RecentPanel: true,
        ShowcaseResultTabs: true
      }
    }
  });

describe('Nano Banana prompt validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.walletMode = false;
    mocks.ensureLoggedIn.mockReturnValue(true);
    mocks.ensureNoPendingUpload.mockReturnValue(true);
    mocks.resolveWallet.mockReturnValue({ address: 'wallet' });
    mocks.generate.mockResolvedValue({ data: { task_id: 'task-1' } });
    vi.spyOn(ElMessage, 'info').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'warning').mockImplementation(() => undefined as never);
  });

  it.each([undefined, '', ' \t\n '])('blocks invalid credits prompt %j before all side effects', async (prompt) => {
    const wrapper = mountPage(prompt);

    await (wrapper.vm as any).onGenerate();

    expect(ElMessage.error).toHaveBeenCalledWith('nanobanana.message.promptRequired');
    expect(mocks.ensureNoPendingUpload).not.toHaveBeenCalled();
    expect(mocks.ensureLoggedIn).not.toHaveBeenCalled();
    expect(mocks.resolveWallet).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.instrument).not.toHaveBeenCalled();
    expect(ElMessage.info).not.toHaveBeenCalled();
  });

  it('requires an edit instruction even when a reference image exists', async () => {
    const wrapper = mountPage('', ['https://example.com/reference.png']);

    await (wrapper.vm as any).onGenerate();

    expect(mocks.generate).not.toHaveBeenCalled();
    expect(ElMessage.error).toHaveBeenCalledWith('nanobanana.message.promptRequired');
  });

  it('submits a trimmed credits request', async () => {
    const wrapper = mountPage('  draw a banana  ');

    await (wrapper.vm as any).onGenerate();
    await flushPromises();

    expect(mocks.ensureLoggedIn).toHaveBeenCalledOnce();
    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'draw a banana', action: 'generate', async: true }),
      { token: 'credential-token' }
    );
    expect(mocks.instrument).toHaveBeenCalledOnce();
  });

  it('blocks a blank wallet prompt before wallet resolution', async () => {
    mocks.walletMode = true;
    const wrapper = mountPage('   ');

    await (wrapper.vm as any).onGenerate();

    expect(mocks.resolveWallet).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it('submits a trimmed wallet edit request', async () => {
    mocks.walletMode = true;
    const wrapper = mountPage('  replace the sky  ', ['https://example.com/reference.png']);

    await (wrapper.vm as any).onGenerate();
    await flushPromises();

    expect(mocks.resolveWallet).toHaveBeenCalledOnce();
    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'replace the sky',
        image_urls: ['https://example.com/reference.png'],
        action: 'edit',
        async: true
      }),
      expect.objectContaining({ mode: 'x402' })
    );
  });
});
