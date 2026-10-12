import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activeEvmWallet,
  connectEvmWallet,
  connectEvmWalletConnect,
  setActiveEvmWallet,
  setActiveWalletRail
} from './evmWallet';
import { evmTransactionUrl, getEvmPaymentNetwork, type EvmWalletRail } from './networks';

const walletConnect = vi.hoisted(() => ({
  connect: vi.fn(),
  request: vi.fn(),
  on: vi.fn(),
  disconnect: vi.fn()
}));
vi.mock('@walletconnect/universal-provider', () => ({ default: { init: async () => walletConnect } }));

const cases = [['arbitrum', 42161, 'ETH', 'https://arbiscan.io']] as const;

beforeEach(() => {
  vi.clearAllMocks();
  setActiveWalletRail('base');
  setActiveEvmWallet(undefined);
});

describe.each(cases)('%s wallet payments', (alias, chainId, gasSymbol, explorer) => {
  const rail = alias as EvmWalletRail;
  const chainHex = `0x${chainId.toString(16)}`;

  it('resolves canonical quotes and links receipts on the selected chain', () => {
    const network = getEvmPaymentNetwork(`eip155:${chainId}`);
    expect(network).toEqual(getEvmPaymentNetwork(alias));
    expect(network?.chainId).toBe(chainHex);
    expect(network?.nativeCurrency.symbol).toBe(gasSymbol);
    expect(network?.rpcUrls[0]).toMatch(/^https:/);
    const hash = '0x' + '1'.repeat(64);
    expect(evmTransactionUrl(`eip155:${chainId}`, hash)).toBe(`${explorer}/tx/${hash}`);
    expect(evmTransactionUrl(`eip155:${chainId}`, 'javascript:bad')).toBeUndefined();
  });

  it('switches to the requested network and rechecks the wallet before connecting', async () => {
    setActiveWalletRail(rail);
    let current = '0x2105';
    const listeners: Record<string, (...args: unknown[]) => void> = {};
    const provider = {
      request: vi.fn(async ({ method, params }: any) => {
        if (method === 'eth_requestAccounts') return ['0xpayer'];
        if (method === 'eth_chainId') return current;
        if (method === 'wallet_switchEthereumChain') current = params[0].chainId;
        return null;
      }),
      on: (name: string, callback: (...args: unknown[]) => void) => {
        listeners[name] = callback;
      }
    };
    const connected = await connectEvmWallet(provider, rail);
    expect(connected.network).toBe(`eip155:${chainId}`);
    expect(provider.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainHex }]
    });
    listeners.chainChanged(chainHex);
    expect(activeEvmWallet()?.address).toBe('0xpayer');
    listeners.chainChanged('0x2105');
    expect(activeEvmWallet()).toBeUndefined();
    listeners.accountsChanged(['0xother']);
    expect(activeEvmWallet()).toBeUndefined();
  });

  it('does not add a chain after a user refuses switching', async () => {
    const provider = {
      request: vi.fn(async ({ method }: any) => {
        if (method === 'eth_requestAccounts') return ['0xpayer'];
        if (method === 'eth_chainId') return '0x2105';
        throw { code: 4001 };
      })
    };
    await expect(connectEvmWallet(provider, rail)).rejects.toMatchObject({ code: 4001 });
    expect(provider.request.mock.calls.map(([args]) => args.method)).not.toContain('wallet_addEthereumChain');
    expect(activeEvmWallet()).toBeUndefined();
  });

  it('rejects a wallet that acknowledges the switch but stays on another chain', async () => {
    const provider = {
      request: vi.fn(async ({ method }: any) => (method === 'eth_requestAccounts' ? ['0xpayer'] : '0x2105'))
    };
    await expect(connectEvmWallet(provider, rail)).rejects.toThrow('network changed');
    expect(activeEvmWallet()).toBeUndefined();
  });

  it('requests the selected chain in WalletConnect instead of a Base session', async () => {
    setActiveWalletRail(rail);
    walletConnect.request.mockImplementation(async ({ method }) =>
      method === 'eth_accounts' ? ['0xpayer'] : chainHex
    );
    await connectEvmWalletConnect(vi.fn(), rail);
    expect(walletConnect.connect).toHaveBeenCalledWith({
      namespaces: { eip155: expect.objectContaining({ chains: [`eip155:${chainId}`] }) }
    });
    expect(activeEvmWallet()?.network).toBe(`eip155:${chainId}`);
    setActiveWalletRail('base');
    expect(activeEvmWallet()).toBeUndefined();
  });
});
