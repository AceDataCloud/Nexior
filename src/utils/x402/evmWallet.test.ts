import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const walletConnect = vi.hoisted(() => {
  const listeners: Record<string, (...args: any[]) => void> = {};
  const provider = {
    on: vi.fn((event: string, listener: (...args: any[]) => void) => {
      listeners[event] = listener;
    }),
    connect: vi.fn(async () => {
      listeners.display_uri?.('wc:test-uri');
    }),
    request: vi.fn(async ({ method }: { method: string }) => (method === 'eth_accounts' ? ['0xwalletconnect'] : [])),
    disconnect: vi.fn()
  };
  return { init: vi.fn(async () => provider), listeners, provider };
});

vi.mock('@walletconnect/universal-provider', () => ({ default: { init: walletConnect.init } }));

import {
  activeEvmWallet,
  connectBaseWallet,
  connectBaseWalletConnect,
  discoverEvmWallets,
  disconnectBaseWallet,
  setActiveEvmWallet
} from './evmWallet';

const originalEthereum = (globalThis as any).ethereum;

describe('Base EVM wallet', () => {
  beforeEach(() => {
    setActiveEvmWallet(undefined);
    (globalThis as any).ethereum = undefined;
  });

  it('switches to Base and stores the connected account', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(['0x1234567890abcdef'])
      .mockResolvedValueOnce('0x1')
      .mockResolvedValueOnce(null);

    const connection = await connectBaseWallet({ request });

    expect(connection.address).toBe('0x1234567890abcdef');
    expect(activeEvmWallet()?.address).toBe('0x1234567890abcdef');
    expect(request).toHaveBeenNthCalledWith(3, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }]
    });
  });

  it('tracks account changes and clears a wallet that leaves Base', async () => {
    const listeners: Record<string, (...args: any[]) => void> = {};
    const provider = {
      request: vi.fn().mockResolvedValueOnce(['0xpayer']).mockResolvedValueOnce('0x2105'),
      on: vi.fn((event: string, listener: (...args: any[]) => void) => {
        listeners[event] = listener;
      })
    };
    await connectBaseWallet(provider);

    listeners.accountsChanged(['0xnext']);
    expect(activeEvmWallet()?.address).toBe('0xnext');
    listeners.chainChanged('0x1');
    expect(activeEvmWallet()).toBeUndefined();
  });

  it('does not switch when the wallet is already on Base', async () => {
    const request = vi.fn().mockResolvedValueOnce(['0xpayer']).mockResolvedValueOnce('0x2105');

    await connectBaseWallet({ request });

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('discovers multiple legacy injected wallets', async () => {
    const metamask = { request: vi.fn(), isMetaMask: true };
    const rabby = { request: vi.fn(), isRabby: true };
    (globalThis as any).ethereum = { providers: [metamask, rabby] };

    const wallets = await discoverEvmWallets();

    expect(wallets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'MetaMask', provider: metamask, readyState: 'Detected' }),
        expect.objectContaining({ name: 'Rabby', provider: rabby, readyState: 'Detected' })
      ])
    );
  });

  it('keeps WalletConnect and install choices when no provider is injected', async () => {
    const wallets = await discoverEvmWallets();

    expect(wallets[0]).toMatchObject({ id: 'walletconnect', name: 'WalletConnect', kind: 'walletconnect' });
    expect(wallets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'MetaMask', readyState: 'NotDetected', installUrl: expect.any(String) }),
        expect.objectContaining({ name: 'Coinbase Wallet', readyState: 'NotDetected', installUrl: expect.any(String) })
      ])
    );
  });

  it('connects WalletConnect to Base and stores its EIP-1193 provider', async () => {
    const onUri = vi.fn();

    const connected = await connectBaseWalletConnect(onUri);

    expect(onUri).toHaveBeenCalledWith('wc:test-uri');
    expect(walletConnect.provider.connect).toHaveBeenCalledWith({
      namespaces: {
        eip155: expect.objectContaining({
          chains: ['eip155:8453'],
          rpcMap: { 8453: expect.stringContaining('chainId=eip155:8453') }
        })
      }
    });
    expect(connected).toMatchObject({ address: '0xwalletconnect', kind: 'walletconnect' });
    expect(activeEvmWallet()?.provider).toBe(walletConnect.provider);

    walletConnect.listeners.session_delete();
    expect(activeEvmWallet()).toBeUndefined();
  });

  it('disconnects the active WalletConnect provider', async () => {
    const disconnect = vi.fn();
    setActiveEvmWallet({
      address: '0xpayer',
      provider: { request: vi.fn(), disconnect },
      kind: 'walletconnect'
    });

    await disconnectBaseWallet();

    expect(disconnect).toHaveBeenCalledOnce();
    expect(activeEvmWallet()).toBeUndefined();
  });
});

afterAll(() => {
  (globalThis as any).ethereum = originalEthereum;
});
