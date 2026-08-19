// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IApplicationScope, IApplicationType, Status } from '@/models';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  normalize: vi.fn(),
  ensureLoggedIn: vi.fn(() => true),
  instrument: vi.fn((_: string, operation: Promise<unknown>) => operation),
  push: vi.fn()
}));

vi.mock('@skjnldsv/vue-plyr', () => ({ default: {} }));
vi.mock('@/operators/seedance', () => ({ seedanceOperator: { generate: mocks.generate } }));
vi.mock('@/plugins/telemetry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/plugins/telemetry')>()),
  instrumentGeneration: mocks.instrument
}));
vi.mock('@/utils/seedance', () => ({ normalizeSeedanceRequest: mocks.normalize }));
vi.mock('@/utils/showcaseRecreateMixin', () => ({ showcaseRecreateMixin: () => ({}) }));
vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => false,
  scenarioPaymentState: () => ({ mode: 'credits' })
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  ensureLoggedIn: mocks.ensureLoggedIn
}));

import SeedanceIndex from './Index.vue';

const selectedApplication = {
  id: 'selected-app',
  user_id: 'payer',
  type: IApplicationType.USAGE,
  scope: IApplicationScope.INDIVIDUAL,
  remaining_amount: 1,
  allow_consume_global: true
};

function mountPage(
  options: {
    globalApplications?: unknown;
    serviceApplications?: unknown;
    application?: typeof selectedApplication;
  } = {}
) {
  const globalApplications =
    'globalApplications' in options
      ? options.globalApplications
      : [
          {
            id: 'global-app',
            user_id: 'payer',
            type: IApplicationType.USAGE,
            scope: IApplicationScope.GLOBAL,
            remaining_amount: 2
          }
        ];
  const serviceApplications =
    'serviceApplications' in options
      ? options.serviceApplications
      : [{ ...selectedApplication, remaining_amount: 1.5 }];
  const dispatch = vi.fn((name: string) => {
    if (name === 'getApplications') return Promise.resolve(globalApplications);
    if (name === 'seedance/getApplications') return Promise.resolve(serviceApplications);
    return Promise.resolve([]);
  });
  const commit = vi.fn();
  const application = options.application ?? selectedApplication;
  const wrapper = shallowMount(SeedanceIndex, {
    global: {
      provide: { initialized: false },
      mocks: {
        $t: (key: string) => key,
        $route: { query: {} },
        $router: { push: mocks.push, replace: vi.fn() },
        $store: {
          state: {
            seedance: {
              application,
              credential: { token: 'credential-token' },
              config: { prompt: 'a video' },
              service: { unit: 'Credit' },
              status: { getApplications: Status.Success, getTasks: Status.Success }
            }
          },
          getters: { site: { metadata: {} } },
          dispatch,
          commit
        }
      },
      stubs: {
        Layout: { template: '<main><slot name="config" /><slot name="result" /></main>' },
        ConfigPanel: true,
        RecentPanel: true,
        QuotaExhaustedDialog: true
      }
    }
  });
  return { wrapper, dispatch, commit };
}

describe('Seedance quota dialog flow', () => {
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

  it('opens a persistent dialog with the submitted estimate and fresh effective balance', async () => {
    mocks.generate.mockRejectedValue({ response: { data: { error: { code: 'used_up' } } } });
    const { wrapper, dispatch, commit } = mountPage();

    await (wrapper.vm as any).onGenerate(8.4);
    await flushPromises();

    expect(closeStarting).toHaveBeenCalledOnce();
    expect(ElMessage.error).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith('getApplications');
    expect(dispatch).toHaveBeenCalledWith('seedance/getApplications');
    expect(commit).toHaveBeenCalledWith('seedance/setApplication', expect.objectContaining({ remaining_amount: 1.5 }));
    expect((wrapper.vm as any).quotaDialogVisible).toBe(true);
    expect((wrapper.vm as any).quotaEstimatedConsumption).toBe(8.4);
    expect((wrapper.vm as any).quotaAvailableCredits).toBe(2);
    expect((wrapper.vm as any).quotaBalanceState).toBe('current');
  });

  it('does not expose a stale balance when either refresh fails', async () => {
    const { wrapper } = mountPage({ globalApplications: undefined });

    await (wrapper.vm as any).onQuotaExhausted(8.4);

    expect((wrapper.vm as any).quotaDialogVisible).toBe(true);
    expect((wrapper.vm as any).quotaAvailableCredits).toBeUndefined();
    expect((wrapper.vm as any).quotaBalanceState).toBe('unavailable');
  });

  it('ignores a late balance refresh after the dialog is closed', async () => {
    let resolveGlobal: (value: unknown[]) => void = () => undefined;
    const globalApplications = new Promise<unknown[]>((resolve) => {
      resolveGlobal = resolve;
    });
    const { wrapper, commit } = mountPage({ globalApplications });

    const refresh = (wrapper.vm as any).onQuotaExhausted(8.4);
    (wrapper.vm as any).onQuotaDialogVisibility(false);
    resolveGlobal([]);
    await refresh;

    expect(commit).not.toHaveBeenCalledWith('seedance/setApplication', expect.anything());
    expect((wrapper.vm as any).quotaDialogVisible).toBe(false);
  });

  it('keeps generic failures on the existing toast path', async () => {
    mocks.generate.mockRejectedValue({ response: { data: { error: { code: 'bad_request', message: 'invalid' } } } });
    const { wrapper } = mountPage();

    await (wrapper.vm as any).onGenerate(8.4);
    await flushPromises();

    expect(closeStarting).toHaveBeenCalledOnce();
    expect(ElMessage.error).toHaveBeenCalledWith('seedance.message.startTaskFailedinvalid');
    expect((wrapper.vm as any).quotaDialogVisible).toBe(false);
  });

  it('routes top-up through the type-aware purchase helper', async () => {
    const { wrapper } = mountPage();
    await wrapper.setData({ quotaApplication: selectedApplication, quotaDialogVisible: true });

    (wrapper.vm as any).onTopUp();

    expect(mocks.push).toHaveBeenCalledWith({
      name: 'console-application-extra',
      params: { id: 'selected-app' }
    });
    expect((wrapper.vm as any).quotaDialogVisible).toBe(false);
  });
});
