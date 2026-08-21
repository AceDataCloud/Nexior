import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IApplicationScope, IApplicationType } from '@/models';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  commit: vi.fn(),
  state: {} as Record<string, any>,
  site: { metadata: {} } as any,
  walletMode: 'credits'
}));

vi.mock('@/store', () => ({
  default: {
    state: mocks.state,
    getters: {
      get site() {
        return mocks.site;
      }
    },
    dispatch: mocks.dispatch,
    commit: mocks.commit
  }
}));
vi.mock('@/utils/surface', () => ({ isIOS: () => false }));
vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => true,
  scenarioPaymentState: () => ({ mode: mocks.walletMode })
}));

import {
  canTopUpQuota,
  closeQuotaExhausted,
  getQuotaPurchaseRoute,
  quotaExhaustedState,
  showQuotaExhausted
} from './quotaExhausted';

const usedUp = { response: { data: { error: { code: 'used_up' } } } };
const selected = {
  id: 'selected',
  user_id: 'payer',
  type: IApplicationType.USAGE,
  scope: IApplicationScope.INDIVIDUAL,
  remaining_amount: 1,
  allow_consume_global: true
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('quota exhausted controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    closeQuotaExhausted();
    mocks.walletMode = 'credits';
    mocks.site = { metadata: {} };
    mocks.state.demo = { application: selected, service: { unit: 'Credit' } };
    mocks.dispatch.mockImplementation((name: string) => {
      if (name === 'getApplications') {
        return Promise.resolve([
          { id: 'global', user_id: 'payer', scope: IApplicationScope.GLOBAL, remaining_amount: 4 }
        ]);
      }
      return Promise.resolve([{ ...selected, remaining_amount: 2 }]);
    });
  });

  it('recognizes both nested and legacy top-level used-up codes', () => {
    mocks.dispatch.mockResolvedValue(undefined);
    expect(showQuotaExhausted({ response: { data: { code: 'used_up' } } }, 'demo')).toBe(true);
    closeQuotaExhausted();
    expect(showQuotaExhausted(usedUp, 'demo')).toBe(true);
  });

  it('ignores non-quota errors and wallet-mode failures', () => {
    expect(showQuotaExhausted({ response: { data: { error: { code: 'forbidden' } } } }, 'demo')).toBe(false);
    mocks.walletMode = 'wallet';
    expect(showQuotaExhausted(usedUp, 'demo')).toBe(false);
    expect(quotaExhaustedState.visible).toBe(false);
  });

  it('opens immediately, snapshots the estimate, then refreshes the effective balance', async () => {
    expect(showQuotaExhausted(usedUp, 'demo', 8.4)).toBe(true);
    expect(quotaExhaustedState).toMatchObject({
      visible: true,
      applicationNamespace: 'demo',
      estimatedConsumption: 8.4,
      balanceState: 'refreshing',
      unit: 'Credit'
    });
    await flush();
    expect(mocks.dispatch).toHaveBeenCalledWith('getApplications');
    expect(mocks.dispatch).toHaveBeenCalledWith('demo/getApplications');
    expect(mocks.commit).toHaveBeenCalledWith('demo/setApplication', expect.objectContaining({ remaining_amount: 2 }));
    expect(quotaExhaustedState.availableCredits).toBe(4);
    expect(quotaExhaustedState.balanceState).toBe('current');
  });

  it('omits an unavailable estimate and degrades when refresh fails', async () => {
    mocks.dispatch.mockResolvedValue(undefined);
    showQuotaExhausted(usedUp, 'demo');
    await flush();
    expect(quotaExhaustedState.estimatedConsumption).toBeUndefined();
    expect(quotaExhaustedState.availableCredits).toBeUndefined();
    expect(quotaExhaustedState.balanceState).toBe('unavailable');
  });

  it('ignores refresh completion after close', async () => {
    let resolveGlobal: (value: unknown) => void = () => undefined;
    mocks.dispatch.mockImplementation((name: string) =>
      name === 'getApplications'
        ? new Promise((resolve) => {
            resolveGlobal = resolve;
          })
        : Promise.resolve([{ ...selected, remaining_amount: 2 }])
    );
    showQuotaExhausted(usedUp, 'demo');
    closeQuotaExhausted();
    resolveGlobal([]);
    await flush();
    expect(mocks.commit).not.toHaveBeenCalled();
    expect(quotaExhaustedState.visible).toBe(false);
  });

  it('returns the gated type-aware purchase route', () => {
    showQuotaExhausted(usedUp, 'demo');
    expect(canTopUpQuota()).toBe(true);
    expect(getQuotaPurchaseRoute()).toEqual({
      name: 'console-application-extra',
      params: { id: 'selected' }
    });
    quotaExhaustedState.application = { ...selected, role: 'grantee' };
    expect(canTopUpQuota()).toBe(false);
    expect(getQuotaPurchaseRoute()).toBeUndefined();
  });
});
