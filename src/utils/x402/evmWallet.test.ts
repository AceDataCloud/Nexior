import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activeEvmWallet, connectBaseWallet, setActiveEvmWallet } from './evmWallet';

describe('Base EVM wallet', () => {
  beforeEach(() => setActiveEvmWallet(undefined));

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
});
