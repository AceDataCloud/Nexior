import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signer: vi.fn(async () => ({ headers: { 'PAYMENT-SIGNATURE': 'signed' } }))
}));

vi.mock('@acedatacloud/x402-client', () => ({ createX402PaymentHandler: () => mocks.signer }));

import {
  formatAtomicUsdc,
  listWalletTasks,
  rememberWalletTask,
  ScenarioPaymentCancelledError,
  submitNanoWithX402,
  submitOpenAIImageWithX402,
  walletTaskIds
} from './scenarioClient';

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

function challengeResponse() {
  const body = { x402Version: 2, accepts: [requirement], error: 'PAYMENT-SIGNATURE header is required' };
  return new Response(JSON.stringify(body), {
    status: 402,
    headers: {
      'content-type': 'application/json',
      'PAYMENT-REQUIRED': Buffer.from(JSON.stringify(body)).toString('base64')
    }
  });
}

function successResponse(taskId: string) {
  return new Response(JSON.stringify({ success: true, task_id: taskId }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

describe('scenarioClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats atomic USDC without floating point rounding', () => {
    expect(formatAtomicUsdc('95215')).toBe('0.095215');
    expect(formatAtomicUsdc('1000000')).toBe('1');
    expect(formatAtomicUsdc('1200000')).toBe('1.2');
  });

  it('does not sign or retry when the user cancels the quote', async () => {
    const fetchMock = vi.fn(async () => challengeResponse());
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      submitNanoWithX402({ action: 'generate', prompt: 'banana', async: true }, wallet, async (quote) => {
        expect(quote.amountUsdc).toBe('0.095215');
        return false;
      })
    ).rejects.toBeInstanceOf(ScenarioPaymentCancelledError);
    expect(mocks.signer).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('signs exactly once, retries once, and preserves async Nano submission', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(challengeResponse())
      .mockResolvedValueOnce(successResponse('nano-task'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitNanoWithX402(
      { action: 'generate', prompt: 'banana', async: true },
      wallet,
      async () => true
    );

    expect(result.taskId).toBe('nano-task');
    expect(mocks.signer).toHaveBeenCalledTimes(1);
    expect(mocks.signer).toHaveBeenCalledWith(
      expect.objectContaining({ accepts: [expect.objectContaining({ description: '图片生成测试' })] })
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, retry] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect((retry.headers as Record<string, string>)['PAYMENT-SIGNATURE']).toBe('signed');
    expect(JSON.parse(retry.body as string)).toEqual(expect.objectContaining({ async: true, prompt: 'banana' }));
  });

  it('preserves async GPT Image generation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(challengeResponse())
      .mockResolvedValueOnce(successResponse('openai-task'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitOpenAIImageWithX402(
      { action: 'generate', model: 'gpt-image-2', prompt: 'cloud', async: true },
      wallet,
      async () => true
    );

    expect(result.taskId).toBe('openai-task');
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe('/x402-api/openai/images/generations');
    expect(JSON.parse(init.body as string)).toEqual(
      expect.objectContaining({ async: true, model: 'gpt-image-2', prompt: 'cloud' })
    );
  });

  it('stores only opaque task IDs scoped to the wallet and service', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value)
    });

    rememberWalletTask('nano-banana', 'payer-a', 'task-1');
    rememberWalletTask('nano-banana', 'payer-a', 'task-2');

    expect(walletTaskIds('nano-banana', 'payer-a')).toEqual(['task-2', 'task-1']);
    expect(walletTaskIds('nano-banana', 'payer-b')).toEqual([]);
    expect(walletTaskIds('openai', 'payer-a')).toEqual([]);
  });

  it('lists wallet tasks by opaque IDs without a payment or authorization header', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ items: [{ id: 'task-1' }], count: 1 }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await listWalletTasks<{ id: string }>('nano-banana', ['task-1'], { limit: 20 });

    expect(result).toEqual({ items: [{ id: 'task-1' }], count: 1 });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({ accept: 'application/json', 'content-type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual(
      expect.objectContaining({ action: 'retrieve_batch', ids: ['task-1'], limit: 20 })
    );
  });
});
