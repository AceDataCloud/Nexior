vi.mock('@/utils/featureFlag', () => ({
  isFeatureEnabled: () => true,
  getStickyFeatureOverrides: () => '',
  setFeatureConfigReader: () => {}
}));
import { afterEach, expect, it, vi } from 'vitest';
import { setActiveWalletRail } from '@/utils/x402/evmWallet';

vi.mock('@/utils/x402/scenarioPayment', () => ({ scenarioPaymentState: () => ({ mode: 'wallet' }) }));
vi.mock('@/utils/x402/continuousPayment', () => ({
  continuousPaymentActive: () => true,
  continuousPaymentHeaders: () => ({ 'X-X402-Authorization': 'solana-recurring-delegation-v1' }),
  refreshContinuousPaymentAuthorization: vi.fn(),
  selectContinuousPayment: vi.fn()
}));

import { chatOperator } from './chat';

afterEach(() => {
  setActiveWalletRail('base');
  vi.unstubAllGlobals();
});

it('does not charge an existing Solana authorization when an EVM rail is selected for chat', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  setActiveWalletRail('arbitrum');
  await expect(
    chatOperator.chatConversation({ model: 'test', message: 'hello' } as never, { token: 'test', stream: vi.fn() })
  ).rejects.toMatchObject({ code: 'payment_authorization_required' });
  expect(fetch).not.toHaveBeenCalled();
});
