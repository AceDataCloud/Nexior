import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  buildSolanaPayment: vi.fn(async (requirement: unknown) => ({
    x402Version: 2,
    accepted: requirement,
    payload: { transaction: 'signed-transaction' }
  })),
  signEVMPayment: vi.fn(async (requirement: unknown) => ({
    x402Version: 2,
    accepted: requirement,
    payload: { authorization: { from: '0xpayer' }, signature: '0xsigned' }
  })),
  activeEvmWallet: vi.fn(),
  activeWalletRail: vi.fn(),
  continuousPaymentActive: vi.fn(),
  continuousPaymentHeaders: vi.fn()
}));

vi.mock('axios', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    isAxiosError: (error: any) => error?.isAxiosError === true
  }
}));
vi.mock('@acedatacloud/x402-client/solana', () => ({ buildSolanaPayment: mocks.buildSolanaPayment }));
vi.mock('@acedatacloud/x402-client', () => ({ signEVMPayment: mocks.signEVMPayment }));
vi.mock('@/utils/x402/evmWallet', () => ({
  activeEvmWallet: mocks.activeEvmWallet,
  activeWalletRail: mocks.activeWalletRail
}));
vi.mock('@/utils/x402/continuousPayment', () => ({
  continuousPaymentActive: mocks.continuousPaymentActive,
  continuousPaymentHeaders: mocks.continuousPaymentHeaders
}));

import { formatAtomicUsdc, postWithX402, quoteX402, X402PaymentCancelledError } from './x402';

const requirement = {
  scheme: 'exact',
  network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  amount: '95215',
  maxTimeoutSeconds: 60,
  resource: 'https://x402.acedata.cloud/nano-banana/images',
  description: '图片生成测试',
  payTo: 'payee',
  asset: 'usdc'
};

const wallet = {
  publicKey: { toBase58: () => 'payer', toString: () => 'payer' },
  signTransaction: vi.fn()
};

const baseRequirement = {
  ...requirement,
  network: 'eip155:8453',
  maxTimeoutSeconds: 3600,
  payTo: '0x1111111111111111111111111111111111111111',
  asset: '0x2222222222222222222222222222222222222222',
  extra: { name: 'USD Coin', version: '2', chainId: 8453 }
};

function challengeError(withHeader = false, accepts = [requirement]) {
  const body = { x402Version: 2, accepts, error: 'PAYMENT-SIGNATURE header is required' };
  return {
    isAxiosError: true,
    response: {
      status: 402,
      data: body,
      headers: withHeader ? { 'payment-required': Buffer.from(JSON.stringify(body)).toString('base64') } : {}
    }
  };
}

describe('postWithX402', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activeEvmWallet.mockReturnValue(undefined);
    mocks.activeWalletRail.mockReturnValue('solana');
    mocks.continuousPaymentActive.mockReturnValue(false);
    mocks.continuousPaymentHeaders.mockReturnValue({
      authorization: 'Bearer identity-token',
      'X-X402-Authorization': 'solana-recurring-delegation-v1'
    });
    mocks.get.mockResolvedValue({ data: { blockhash: 'fresh-blockhash' } });
  });

  it('formats atomic USDC without floating point rounding', () => {
    expect(formatAtomicUsdc('95215')).toBe('0.095215');
    expect(formatAtomicUsdc('1000000')).toBe('1');
    expect(formatAtomicUsdc('1200000')).toBe('1.2');
  });

  it('fetches an authoritative quote without signing or retrying', async () => {
    mocks.post.mockRejectedValueOnce(challengeError(true));

    const quote = await quoteX402('/nano-banana/images', { action: 'generate', prompt: 'banana', async: true });

    expect(quote.amountUsdc).toBe('0.095215');
    expect(quote.requirement).toEqual(requirement);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.buildSolanaPayment).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('uses a reusable Solana authorization without a quote or wallet signature', async () => {
    mocks.continuousPaymentActive.mockReturnValue(true);
    mocks.post.mockResolvedValueOnce({ data: { task_id: 'continuous-task' } });

    const response = await postWithX402<{ task_id: string }>(
      '/nano-banana/images',
      { prompt: 'banana', async: true },
      { wallet, confirm: async () => true, identityToken: 'identity-token' }
    );

    expect(response.data.task_id).toBe('continuous-task');
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.post.mock.calls[0][2].headers).toEqual(
      expect.objectContaining({
        authorization: 'Bearer identity-token',
        'X-X402-Authorization': 'solana-recurring-delegation-v1'
      })
    );
    expect(mocks.buildSolanaPayment).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('does not sign or retry when the user cancels the authoritative quote', async () => {
    mocks.post.mockRejectedValueOnce(challengeError());

    await expect(
      postWithX402(
        '/nano-banana/images',
        { action: 'generate', prompt: 'banana', async: true },
        {
          wallet,
          confirm: async (quote) => {
            expect(quote.amountUsdc).toBe('0.095215');
            return false;
          }
        }
      )
    ).rejects.toBeInstanceOf(X402PaymentCancelledError);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.buildSolanaPayment).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('uses the server blockhash, signs once, and retries once', async () => {
    mocks.post.mockRejectedValueOnce(challengeError(true)).mockResolvedValueOnce({ data: { task_id: 'task-1' } });

    const response = await postWithX402<{ task_id: string }>(
      '/nano-banana/images',
      { action: 'generate', prompt: 'banana', async: true },
      { wallet, confirm: async () => true, identityToken: 'identity-token' }
    );

    expect(response.data.task_id).toBe('task-1');
    expect(mocks.get).toHaveBeenCalledWith('/api/v1/x402/solana/latest-blockhash/', {
      baseURL: 'https://platform.acedata.cloud',
      params: { network: requirement.network }
    });
    expect(mocks.buildSolanaPayment).toHaveBeenCalledWith(
      expect.objectContaining({ description: '图片生成测试' }),
      wallet,
      'fresh-blockhash'
    );
    const initialConfig = mocks.post.mock.calls[0][2];
    expect(initialConfig.headers.authorization).toBe('Bearer identity-token');
    const retryConfig = mocks.post.mock.calls[1][2];
    expect(retryConfig.headers.authorization).toBe('Bearer identity-token');
    const envelope = JSON.parse(Buffer.from(retryConfig.headers['PAYMENT-SIGNATURE'], 'base64').toString('utf8'));
    expect(envelope).toEqual(expect.objectContaining({ x402Version: 2, accepted: requirement }));
    expect(mocks.post).toHaveBeenCalledTimes(2);
  });

  it('prefers Base exact when an EVM wallet is connected', async () => {
    const provider = { request: vi.fn() };
    mocks.activeWalletRail.mockReturnValue('base');
    mocks.activeEvmWallet.mockReturnValue({ address: '0xpayer', provider });
    mocks.post
      .mockRejectedValueOnce(challengeError(true, [requirement, baseRequirement]))
      .mockResolvedValueOnce({ data: { task_id: 'base-task' } });

    const response = await postWithX402<{ task_id: string }>(
      '/openai/images/generations',
      { model: 'gpt-image-2', async: true },
      { wallet, confirm: async () => true }
    );

    expect(response.data.task_id).toBe('base-task');
    expect(mocks.signEVMPayment).toHaveBeenCalledWith(baseRequirement, provider, '0xpayer');
    expect(mocks.buildSolanaPayment).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
    const retryConfig = mocks.post.mock.calls[1][2];
    const envelope = JSON.parse(Buffer.from(retryConfig.headers['PAYMENT-SIGNATURE'], 'base64').toString('utf8'));
    expect(envelope).toEqual(expect.objectContaining({ x402Version: 2, accepted: baseRequirement }));
  });

  it('uses the 402 body when browsers cannot expose PAYMENT-REQUIRED', async () => {
    mocks.post.mockRejectedValueOnce(challengeError()).mockResolvedValueOnce({ data: { task_id: 'task-2' } });

    await postWithX402(
      '/openai/images/generations',
      { model: 'gpt-image-2', async: true },
      {
        wallet,
        confirm: async (quote) => quote.requirement.description === '图片生成测试'
      }
    );

    expect(mocks.buildSolanaPayment).toHaveBeenCalledTimes(1);
  });
});
