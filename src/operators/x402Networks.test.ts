import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActiveEvmWallet, setActiveWalletRail } from '@/utils/x402/evmWallet';
import type { EvmWalletRail } from '@/utils/x402/networks';

const mocks = vi.hoisted(() => ({ post: vi.fn(), sign: vi.fn() }));
vi.mock('axios', () => ({
  default: { post: mocks.post, isAxiosError: (error: any) => error?.response?.status === 402 }
}));
vi.mock('@acedatacloud/x402-client', () => ({ signEVMPayment: mocks.sign }));
vi.mock('@/utils/x402/continuousPayment', () => ({ continuousPaymentActive: () => false }));

import { postWithX402, resolveX402WalletContext } from './x402';

const cases = [['arbitrum', 42161, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831']] as const;

beforeEach(() => {
  vi.resetAllMocks();
  setActiveWalletRail('base');
  setActiveEvmWallet(undefined);
  mocks.sign.mockImplementation(async (accepted) => ({ x402Version: 2, accepted, payload: { signature: 'signed' } }));
});

describe.each(cases)('%s signed retry', (alias, chainId, asset) => {
  const selected = {
    scheme: 'exact',
    network: `eip155:${chainId}`,
    asset,
    amount: '1250000',
    payTo: '0x' + '1'.repeat(40),
    extra: { name: 'USD Coin', version: '2', chainId }
  };
  const base = { ...selected, network: 'eip155:8453', extra: { ...selected.extra, chainId: 8453 } };
  const challenge = (accepts: unknown[]) => ({
    response: { status: 402, headers: {}, data: { x402Version: 2, accepts } }
  });

  function wallet() {
    setActiveWalletRail(alias as EvmWalletRail);
    const provider = { request: vi.fn().mockResolvedValue(`0x${chainId.toString(16)}`) };
    setActiveEvmWallet({ address: '0xpayer', provider, network: selected.network });
    return { provider, context: resolveX402WalletContext(undefined)! };
  }

  it('confirms and signs only the selected quote when Base is also offered', async () => {
    const connected = wallet();
    const confirm = vi.fn(async () => true);
    mocks.post.mockRejectedValueOnce(challenge([base, selected])).mockResolvedValueOnce({ data: 'ok' });
    await postWithX402('/test', {}, { wallet: connected.context, confirm });
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ network: selected.network, amountUsdc: '1.25' }));
    expect(mocks.sign).toHaveBeenCalledWith(selected, connected.provider, '0xpayer');
    const envelope = JSON.parse(
      Buffer.from(mocks.post.mock.calls[1][2].headers['PAYMENT-SIGNATURE'], 'base64').toString()
    );
    expect(envelope.accepted).toEqual(selected);
  });

  it('does not fall back to Base when the selected rail is not offered', async () => {
    const connected = wallet();
    const confirm = vi.fn();
    mocks.post.mockRejectedValueOnce(challenge([base]));
    await expect(postWithX402('/test', {}, { wallet: connected.context, confirm })).rejects.toMatchObject({
      paymentError: { code: 'payment_requirements_unavailable', charged: false }
    });
    expect(confirm).not.toHaveBeenCalled();
    expect(mocks.sign).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('stops if the selected rail changes while the confirmation is open', async () => {
    const connected = wallet();
    mocks.post.mockRejectedValueOnce(challenge([selected]));
    await expect(
      postWithX402(
        '/test',
        {},
        {
          wallet: connected.context,
          confirm: async () => {
            setActiveWalletRail('base');
            return true;
          }
        }
      )
    ).rejects.toThrow('X402 payment failed');
    expect(mocks.sign).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('stops before signing when the wallet has moved to Base', async () => {
    const connected = wallet();
    connected.provider.request.mockResolvedValue('0x2105');
    mocks.post.mockRejectedValueOnce(challenge([selected]));
    await expect(postWithX402('/test', {}, { wallet: connected.context, confirm: async () => true })).rejects.toThrow(
      'X402 payment failed'
    );
    expect(mocks.sign).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });
});
