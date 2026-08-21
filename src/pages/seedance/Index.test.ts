// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Status } from '@/models';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  normalize: vi.fn(),
  ensureLoggedIn: vi.fn(() => true),
  instrument: vi.fn((_: string, operation: Promise<unknown>) => operation),
  showQuota: vi.fn()
}));

vi.mock('@skjnldsv/vue-plyr', () => ({ default: {} }));
vi.mock('@/operators/seedance', () => ({ seedanceOperator: { generate: mocks.generate } }));
vi.mock('@/plugins/telemetry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/plugins/telemetry')>()),
  instrumentGeneration: mocks.instrument
}));
vi.mock('@/utils/seedance', () => ({ normalizeSeedanceRequest: mocks.normalize }));
vi.mock('@/utils/showcaseRecreateMixin', () => ({ showcaseRecreateMixin: () => ({}) }));
vi.mock('@/utils/quotaExhausted', () => ({ showQuotaExhausted: mocks.showQuota }));
vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => false,
  scenarioPaymentState: () => ({ mode: 'credits' })
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  ensureLoggedIn: mocks.ensureLoggedIn,
  showQuotaExhausted: mocks.showQuota
}));

import SeedanceIndex from './Index.vue';

const mountPage = () =>
  shallowMount(SeedanceIndex, {
    global: {
      provide: { initialized: false },
      mocks: {
        $t: (key: string) => key,
        $route: { query: {} },
        $router: { replace: vi.fn() },
        $store: {
          state: {
            seedance: {
              credential: { token: 'credential-token' },
              config: { prompt: 'a video' },
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
        RecentPanel: true
      }
    }
  });

describe('Seedance quota handling', () => {
  let closeStarting: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    closeStarting = vi.fn();
    mocks.normalize.mockReturnValue({ request: { prompt: 'a video', async: true } });
    mocks.ensureLoggedIn.mockReturnValue(true);
    vi.spyOn(ElMessage, 'info').mockReturnValue({ close: closeStarting } as never);
    vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'warning').mockImplementation(() => undefined as never);
  });

  it('delegates used-up recovery and its submitted estimate to the shared controller', async () => {
    const error = { response: { data: { error: { code: 'used_up' } } } };
    mocks.generate.mockRejectedValue(error);
    mocks.showQuota.mockReturnValue(true);
    const wrapper = mountPage();

    await (wrapper.vm as any).onGenerate(8.4);
    await flushPromises();

    expect(closeStarting).toHaveBeenCalledOnce();
    expect(mocks.showQuota).toHaveBeenCalledWith(error, 'seedance', 8.4);
    expect(ElMessage.error).not.toHaveBeenCalled();
  });

  it('keeps non-quota failures on the existing toast path', async () => {
    const error = { response: { data: { error: { code: 'bad_request', message: 'invalid' } } } };
    mocks.generate.mockRejectedValue(error);
    mocks.showQuota.mockReturnValue(false);
    const wrapper = mountPage();

    await (wrapper.vm as any).onGenerate(8.4);
    await flushPromises();

    expect(mocks.showQuota).toHaveBeenCalledWith(error, 'seedance', 8.4);
    expect(ElMessage.error).toHaveBeenCalledWith('seedance.message.startTaskFailedinvalid');
  });
});
