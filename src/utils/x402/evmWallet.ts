import { shallowRef } from 'vue';

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: any[]) => void): void;
}

export interface EvmWalletConnection {
  address: string;
  provider: Eip1193Provider;
}

export interface EvmWalletInfo {
  id: string;
  name: string;
  icon?: string;
  provider: Eip1193Provider;
}

const connection = shallowRef<EvmWalletConnection>();
const watchedProviders = new WeakSet<object>();
const rail = shallowRef<'base' | 'solana'>('base');

export function activeWalletRail(): 'base' | 'solana' {
  return rail.value;
}

export function setActiveWalletRail(value: 'base' | 'solana'): void {
  rail.value = value;
}

export function activeEvmWallet(): EvmWalletConnection | undefined {
  return connection.value;
}

export function setActiveEvmWallet(value: EvmWalletConnection | undefined): void {
  connection.value = value;
}

export async function discoverEvmWallets(): Promise<EvmWalletInfo[]> {
  const found = new Map<string, EvmWalletInfo>();
  if (typeof window !== 'undefined') {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const provider = detail.provider as Eip1193Provider | undefined;
      if (!provider) return;
      const id = String(detail.info?.uuid || detail.info?.rdns || detail.info?.name || found.size);
      found.set(id, { id, name: String(detail.info?.name || 'Wallet'), icon: detail.info?.icon, provider });
    };
    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    window.removeEventListener('eip6963:announceProvider', handler);
  }
  const injected = (globalThis as any).ethereum as Eip1193Provider | undefined;
  if (injected && found.size === 0)
    found.set('injected', { id: 'injected', name: 'Injected Wallet', provider: injected });
  return Array.from(found.values());
}

export async function connectBaseWallet(provider: Eip1193Provider): Promise<EvmWalletConnection> {
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error('No EVM wallet account is available');
  const baseChainId = '0x2105';
  const chainId = String(await provider.request({ method: 'eth_chainId' })).toLowerCase();
  if (chainId !== baseChainId) {
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: baseChainId }] });
    } catch {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: baseChainId,
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          }
        ]
      });
    }
  }
  connection.value = { address, provider };
  if (provider.on && !watchedProviders.has(provider as object)) {
    watchedProviders.add(provider as object);
    provider.on('accountsChanged', (...args: any[]) => {
      const accounts = args[0] as string[] | undefined;
      connection.value = accounts?.[0] ? { address: accounts[0], provider } : undefined;
    });
    provider.on('chainChanged', (...args: any[]) => {
      if (String(args[0]).toLowerCase() !== baseChainId) connection.value = undefined;
    });
  }
  return connection.value;
}
