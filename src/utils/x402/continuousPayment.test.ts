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
      signTransaction: { value: signTransaction },
      wallet: { value: { adapter: { name: 'Phantom' } } }
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
    vi.stubGlobal('window', {});
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
    expect(mockedAxios.post.mock.calls[2][1]).toEqual(
      expect.objectContaining({
        setup_token: 'setup',
        action: 'init_authority',
        signed_transaction: expect.any(String)
      })
    );
    expect(mockedAxios.post.mock.calls[2][1]).not.toHaveProperty('signature');
    expect(track).toHaveBeenCalledWith('x402_continuous_payment_success', { action: 'enable:confirm' });
  });

  it('uses Phantom sign-and-send and registers only the returned signature', async () => {
    const wallet = walletApi();
    const signAndSendTransaction = vi.fn().mockResolvedValue({ signature: 'wallet-signature' });
    (window as any).phantom = {
      solana: { isPhantom: true, publicKey: wallet.keypair.publicKey, signAndSendTransaction }
    };
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          setup_token: 'setup',
          wallet: wallet.keypair.publicKey.toBase58(),
          authority_init_id: 42,
          wallet_broadcast_supported: true
        }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: 'wallet-signature', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    await enableContinuousPayment({
      token: 'token',
      walletApi: wallet.api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });

    expect(signAndSendTransaction).toHaveBeenCalledTimes(1);
    expect(wallet.signTransaction).not.toHaveBeenCalled();
    const submitCall = mockedAxios.post.mock.calls.find(
      (call) => call[0] === '/api/v1/x402/payment-authorization/transaction/submit/'
    );
    expect(submitCall?.[1]).toEqual({
      setup_token: 'setup',
      action: 'create_delegation',
      signature: 'wallet-signature'
    });
    expect(submitCall?.[1]).not.toHaveProperty('signed_transaction');
    expect(track).toHaveBeenCalledWith('x402_continuous_payment_submit', {
      action: 'create_delegation:wallet_send'
    });
    expect(track).toHaveBeenCalledWith('x402_continuous_payment_submit', {
      action: 'create_delegation:register'
    });
  });

  it('keeps legacy submission when Backend does not advertise wallet broadcast support', async () => {
    const wallet = walletApi();
    const signAndSendTransaction = vi.fn();
    (window as any).phantom = {
      solana: { isPhantom: true, publicKey: wallet.keypair.publicKey, signAndSendTransaction }
    };
    mockedAxios.post
      .mockResolvedValueOnce({
        data: { setup_token: 'setup', wallet: wallet.keypair.publicKey.toBase58(), authority_init_id: 42 }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: 'legacy-signature', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    await enableContinuousPayment({
      token: 'token',
      walletApi: wallet.api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });

    expect(signAndSendTransaction).not.toHaveBeenCalled();
    expect(wallet.signTransaction).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post.mock.calls[2][1]).toEqual(
      expect.objectContaining({ signed_transaction: expect.any(String) })
    );
  });

  it('uses the selected provider when Phantom and Solflare share an address', async () => {
    const wallet = walletApi();
    const phantomSend = vi.fn();
    const solflareSend = vi.fn().mockResolvedValue({ signature: 'solflare-signature' });
    (window as any).phantom = {
      solana: { isPhantom: true, publicKey: wallet.keypair.publicKey, signAndSendTransaction: phantomSend }
    };
    (window as any).solflare = {
      isSolflare: true,
      publicKey: wallet.keypair.publicKey,
      signAndSendTransaction: solflareSend
    };
    const api = {
      ...wallet.api,
      wallet: { value: { adapter: { name: 'Solflare' } } }
    };
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          setup_token: 'setup',
          wallet: wallet.keypair.publicKey.toBase58(),
          authority_init_id: 42,
          wallet_broadcast_supported: true
        }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: 'solflare-signature', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    await enableContinuousPayment({
      token: 'token',
      walletApi: api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });

    expect(solflareSend).toHaveBeenCalledTimes(1);
    expect(phantomSend).not.toHaveBeenCalled();
    expect(wallet.signTransaction).not.toHaveBeenCalled();
  });

  it('registers an uncertain broadcast after a provider timeout instead of replaying', async () => {
    vi.useFakeTimers();
    const wallet = walletApi();
    const signAndSendTransaction = vi.fn().mockRejectedValue(new Error('RPC timeout'));
    (window as any).phantom = {
      solana: { isPhantom: true, publicKey: wallet.keypair.publicKey, signAndSendTransaction }
    };
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          setup_token: 'setup',
          wallet: wallet.keypair.publicKey.toBase58(),
          authority_init_id: 42,
          wallet_broadcast_supported: true
        }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: '', status: 'uncertain' } })
      .mockResolvedValueOnce({ data: { signature: 'recovered-signature', status: 'confirmed' } })
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

    expect(signAndSendTransaction).toHaveBeenCalledTimes(1);
    expect(wallet.signTransaction).not.toHaveBeenCalled();
    expect(mockedAxios.post.mock.calls[2][1]).toEqual({
      setup_token: 'setup',
      action: 'create_delegation',
      broadcast_uncertain: true
    });
    expect(track).toHaveBeenCalledWith('x402_continuous_payment_submit', {
      action: 'create_delegation:uncertain'
    });
  });

  it('does not mark an explicit wallet rejection as an uncertain broadcast', async () => {
    const wallet = walletApi();
    const rejected: any = new Error('User rejected the request');
    rejected.code = 4001;
    const signAndSendTransaction = vi.fn().mockRejectedValue(rejected);
    (window as any).phantom = {
      solana: { isPhantom: true, publicKey: wallet.keypair.publicKey, signAndSendTransaction }
    };
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          setup_token: 'setup',
          wallet: wallet.keypair.publicKey.toBase58(),
          authority_init_id: 42,
          wallet_broadcast_supported: true
        }
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
    ).rejects.toThrow('User rejected');

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(wallet.signTransaction).not.toHaveBeenCalled();
  });

  it('does not use an installed provider for a different connected wallet', async () => {
    const wallet = walletApi();
    const signAndSendTransaction = vi.fn();
    (window as any).phantom = {
      solana: { isPhantom: true, publicKey: Keypair.generate().publicKey, signAndSendTransaction }
    };
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          setup_token: 'setup',
          wallet: wallet.keypair.publicKey.toBase58(),
          authority_init_id: 42,
          wallet_broadcast_supported: true
        }
      })
      .mockResolvedValueOnce({
        data: { action: 'create_delegation', transaction: unsignedTransaction(wallet.keypair) }
      })
      .mockResolvedValueOnce({ data: { signature: 'legacy-signature', status: 'confirmed' } })
      .mockResolvedValueOnce({ data: { authorization: { id: 'auth', state: 'active' } } });

    await enableContinuousPayment({
      token: 'token',
      walletApi: wallet.api,
      dailyLimitAtomic: '100000',
      expiryTs: 1_900_000_000
    });

    expect(signAndSendTransaction).not.toHaveBeenCalled();
    expect(wallet.signTransaction).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post.mock.calls[2][1]).toEqual(
      expect.objectContaining({ signed_transaction: expect.any(String) })
    );
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
