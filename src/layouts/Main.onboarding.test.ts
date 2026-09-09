// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createApplication: vi.fn(),
  track: vi.fn()
}));

vi.mock('@/operators', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/operators')>()),
  applicationOperator: { create: mocks.createApplication }
}));

vi.mock('@/plugins/telemetry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/plugins/telemetry')>()),
  track: mocks.track
}));

vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Supported: () => false,
  scenarioPaymentState: () => ({ mode: 'credits', walletAvailable: false })
}));

import Main from './Main.vue';
import { ERROR_CODE_DUPLICATION } from '@/constants';
import { IApplicationScope, IApplicationType, type IApplication } from '@/models';

const globalApplication = (remainingAmount: number): IApplication => ({
  id: `global-${remainingAmount}`,
  scope: IApplicationScope.GLOBAL,
  type: IApplicationType.USAGE,
  remaining_amount: remainingAmount
});

const mountMain = (refreshed: IApplication[] | undefined, refreshError?: Error) => {
  const dispatch = vi.fn((action: string) => {
    if (action !== 'getApplications') return Promise.resolve(undefined);
    return refreshError ? Promise.reject(refreshError) : Promise.resolve(refreshed);
  });
  const translate = vi.fn((key: string) => key);
  const wrapper = shallowMount(Main, {
    global: {
      stubs: {
        RouterView: true,
        Navigator: true,
        ApplicationStatus: true,
        ApplicationConfirm: true
      },
      mocks: {
        $route: { meta: {} },
        $store: {
          state: {
            token: { access: 'token' },
            applications: [],
            site: { title: 'Test Site' },
            user: { id: 'user-1' }
          },
          getters: { user: { id: 'user-1' } },
          dispatch,
          commit: vi.fn()
        },
        $t: translate
      }
    }
  });
  return { wrapper, dispatch, translate };
};

describe('Main application onboarding integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createApplication.mockResolvedValue({ data: { id: 'created' } });
  });

  it.each([
    [9, 'positive', 'application.message.welcomeWithCredits'],
    [0, 'zero', 'application.message.welcomeNoCredits']
  ])('tracks refreshed global balance %s as %s', async (remainingAmount, creditState, welcomeKey) => {
    const application = globalApplication(remainingAmount as number);
    const { wrapper, dispatch, translate } = mountMain([application]);

    await (wrapper.vm as any).onAutoApply();

    expect(mocks.createApplication).toHaveBeenCalledWith({
      type: IApplicationType.USAGE,
      scope: IApplicationScope.GLOBAL,
      user_id: 'user-1'
    });
    expect(dispatch).toHaveBeenCalledWith('getApplications');
    expect(mocks.track).toHaveBeenCalledWith('application_prepared', {
      application_id: application.id,
      credit_state: creditState
    });
    expect(translate).toHaveBeenCalledWith(welcomeKey, expect.any(Object));
    wrapper.unmount();
  });

  it('tracks duplicate recovery only after refresh proves the global application', async () => {
    const application = globalApplication(3);
    mocks.createApplication.mockRejectedValue({ response: { data: { code: ERROR_CODE_DUPLICATION } } });
    const { wrapper, translate } = mountMain([application]);

    await (wrapper.vm as any).onAutoApply();

    expect(mocks.track).toHaveBeenCalledWith('application_prepared', {
      application_id: application.id,
      credit_state: 'positive'
    });
    expect(translate).not.toHaveBeenCalledWith('application.message.welcomeWithCredits', expect.anything());
    wrapper.unmount();
  });

  it('does not report preparation or welcome after a non-duplicate create failure', async () => {
    mocks.createApplication.mockRejectedValue({ response: { data: { code: 'create_failed' } } });
    const { wrapper, dispatch, translate } = mountMain([]);

    await (wrapper.vm as any).onAutoApply();

    expect(dispatch).not.toHaveBeenCalledWith('getApplications');
    expect(mocks.track).not.toHaveBeenCalledWith('application_prepared', expect.anything());
    expect(translate).toHaveBeenCalledWith('application.message.applyFailed');
    expect(translate).not.toHaveBeenCalledWith('application.message.welcomeWithCredits', expect.anything());
    expect(translate).not.toHaveBeenCalledWith('application.message.welcomeNoCredits', expect.anything());
    wrapper.unmount();
  });

  it('does not report preparation or welcome when the proof refresh rejects', async () => {
    const { wrapper, translate } = mountMain([], new Error('refresh failed'));

    await (wrapper.vm as any).onAutoApply();

    expect(mocks.track).not.toHaveBeenCalledWith('application_prepared', expect.anything());
    expect(translate).toHaveBeenCalledWith('application.message.applyFailed');
    expect(translate).not.toHaveBeenCalledWith('application.message.welcomeWithCredits', expect.anything());
    expect(translate).not.toHaveBeenCalledWith('application.message.welcomeNoCredits', expect.anything());
    wrapper.unmount();
  });

  it('does not claim preparation when refresh lacks a global application', async () => {
    const { wrapper } = mountMain([{ id: 'individual', scope: IApplicationScope.INDIVIDUAL, remaining_amount: 12 }]);

    await (wrapper.vm as any).onAutoApply();

    expect(mocks.track).not.toHaveBeenCalledWith('application_prepared', expect.anything());
    wrapper.unmount();
  });
});
