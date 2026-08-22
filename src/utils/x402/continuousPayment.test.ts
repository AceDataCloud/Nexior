import axios from 'axios';
import { Keypair, Transaction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/plugins/telemetry', () => ({ track }));
vi.mock('axios');

import { enableContinuousPayment } from './continuousPayment';

const mockedAxios = vi.mocked(axios, true);

function walletApi() {
  const keypair = Keypair.generate();
  const signTransaction = vi.fn(async (transaction: Transaction) => {
    transaction.partialSign(keypair);
    return transaction;
  });
  return {
    keypair,
    signTransaction,
    api: {
      publicKey: { value: keypair.publicKey },
      signTransaction: { value: signTransaction }
    }
  };
}

function unsignedTransaction(wallet: Keypair): string {
  const transaction = new Transaction({
    feePayer: wallet.publicKey,
    recentBlockhash: Keypair.generate().publicKey.toBase58()
  });
  return Buffer.from(transaction.serialize({ requireAllSignatures: false, verifySignatures: false })).toString(
    'base64'
  );
}

describe('continuous payment Backend orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the public wallet signer and submits Backend-prepared transactions in order', async () => {
    const wallet = walletApi();
    mockedAxios.post
      .mockResolvedValueOnce({
        data: { setup_token: 'setup', wallet: wallet.keypair.publicKey.toBase58(), authority_init_id: null }
      })
      .mockResolvedValueOnce({ data: { action: 'init_authority', transaction: unsignedTransaction(wallet.keypair) } })
      .mockResolvedValueOnce({ data: { signature: 'init', status: 'confirmed' } })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: 'delegation', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    const result = await enableContinuousPayment({
      token: 'token',
      walletApi: wallet.api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });

    expect(result?.state).toBe('active');
    expect(wallet.signTransaction).toHaveBeenCalledTimes(2);
    expect(mockedAxios.post.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/x402/payment-authorization/setup/',
      '/api/v1/x402/payment-authorization/transaction/prepare/',
      '/api/v1/x402/payment-authorization/transaction/submit/',
      '/api/v1/x402/payment-authorization/transaction/prepare/',
      '/api/v1/x402/payment-authorization/transaction/submit/',
      '/api/v1/x402/payment-authorization/confirm/'
    ]);
    expect(track).toHaveBeenCalledWith('x402_continuous_payment_success', { action: 'enable:confirm' });
  });

  it('skips authority initialization when Backend reports an existing authority', async () => {
    const wallet = walletApi();
    mockedAxios.post
      .mockResolvedValueOnce({
        data: { setup_token: 'setup', wallet: wallet.keypair.publicKey.toBase58(), authority_init_id: 42 }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: 'delegation', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    await enableContinuousPayment({
      token: 'token',
      walletApi: wallet.api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });

    expect(wallet.signTransaction).toHaveBeenCalledTimes(1);
  });

  it('polls status without rebroadcasting while confirmation is pending', async () => {
    vi.useFakeTimers();
    const wallet = walletApi();
    mockedAxios.post
      .mockResolvedValueOnce({
        data: { setup_token: 'setup', wallet: wallet.keypair.publicKey.toBase58(), authority_init_id: 42 }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: 'delegation', status: 'pending' } })
      .mockResolvedValueOnce({ data: { signature: 'delegation', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    const pending = enableContinuousPayment({
      token: 'token',
      walletApi: wallet.api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });
    await vi.runAllTimersAsync();
    await pending;
    vi.useRealTimers();

    expect(wallet.signTransaction).toHaveBeenCalledTimes(1);
    const submitCalls = mockedAxios.post.mock.calls.filter(
      (call) => call[0] === '/api/v1/x402/payment-authorization/transaction/submit/'
    );
    const statusCalls = mockedAxios.post.mock.calls.filter(
      (call) => call[0] === '/api/v1/x402/payment-authorization/transaction/status/'
    );
    expect(submitCalls).toHaveLength(1);
    expect(statusCalls).toHaveLength(1);
    expect(statusCalls[0][1]).toEqual({ setup_token: 'setup', action: 'create_delegation' });
  });

  it('resumes a pending Backend challenge without signing a new transaction', async () => {
    vi.useFakeTimers();
    const wallet = walletApi();
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          setup_token: 'resumed',
          wallet: wallet.keypair.publicKey.toBase58(),
          authority_init_id: 42,
          transactions: { create_delegation: { signature: 'existing', status: 'pending' } }
        }
      })
      .mockResolvedValueOnce({ data: { signature: 'existing', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    const resumed = enableContinuousPayment({
      token: 'token',
      walletApi: wallet.api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });
    await vi.runAllTimersAsync();
    await resumed;
    vi.useRealTimers();

    expect(wallet.signTransaction).not.toHaveBeenCalled();
    expect(mockedAxios.post.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/x402/payment-authorization/setup/',
      '/api/v1/x402/payment-authorization/transaction/status/',
      '/api/v1/x402/payment-authorization/confirm/'
    ]);
  });

  it('does not confirm after signing or submission fails', async () => {
    const wallet = walletApi();
    wallet.signTransaction.mockRejectedValueOnce(new Error('user rejected'));
    mockedAxios.post
      .mockResolvedValueOnce({
        data: { setup_token: 'setup', wallet: wallet.keypair.publicKey.toBase58(), authority_init_id: 42 }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      });

    await expect(
      enableContinuousPayment({
        token: 'token',
        walletApi: wallet.api,
        dailyLimitAtomic: '100000',
        expiryTs: 1_900_000_000
      })
    ).rejects.toThrow('user rejected');

    expect(mockedAxios.post.mock.calls.some((call) => call[0] === '/api/v1/x402/payment-authorization/confirm/')).toBe(
      false
    );
    expect(track).toHaveBeenCalledWith(
      'x402_continuous_payment_failed',
      expect.objectContaining({ action: 'enable', error: 'Error' })
    );
  });
});
