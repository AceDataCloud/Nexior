import { shallowRef } from 'vue';

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: any[]) => void): void;
  disconnect?(): Promise<void>;
}

export interface EvmWalletConnection {
  address: string;
  provider: Eip1193Provider;
  kind?: 'injected' | 'walletconnect';
}

export interface EvmWalletInfo {
  id: string;
  name: string;
  icon?: string;
  provider?: Eip1193Provider;
  kind: 'injected' | 'walletconnect';
  readyState: 'Detected' | 'NotDetected';
  installUrl?: string;
}

const BASE_CHAIN_ID = '0x2105';
const BASE_CAIP_CHAIN = 'eip155:8453';
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8442ba82a50e5d4a993fc9d82ba15c59';
const KNOWN_WALLETS = [
  { name: 'MetaMask', installUrl: 'https://metamask.io/download/' },
  { name: 'Coinbase Wallet', installUrl: 'https://www.coinbase.com/wallet/downloads' },
  { name: 'Rabby', installUrl: 'https://rabby.io/' },
  { name: 'OKX Wallet', installUrl: 'https://www.okx.com/web3' },
  { name: 'Trust Wallet', installUrl: 'https://trustwallet.com/browser-extension' },
  { name: 'Phantom', installUrl: 'https://phantom.app/download' },
  { name: 'Rainbow', installUrl: 'https://rainbow.me/download' }
];

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

function injectedWalletName(provider: any): string {
  if (provider?.isMetaMask) return 'MetaMask';
  if (provider?.isCoinbaseWallet) return 'Coinbase Wallet';
  if (provider?.isBraveWallet) return 'Brave Wallet';
  if (provider?.isRabby) return 'Rabby';
  if (provider?.isOkxWallet || provider?.isOKExWallet) return 'OKX Wallet';
  if (provider?.isTrust || provider?.isTrustWallet) return 'Trust Wallet';
  if (provider?.isPhantom) return 'Phantom';
  return 'Injected Wallet';
}

export async function discoverEvmWallets(): Promise<EvmWalletInfo[]> {
  const found = new Map<string, EvmWalletInfo>();
  if (typeof window !== 'undefined') {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const provider = detail.provider as Eip1193Provider | undefined;
      if (!provider) return;
      const name = String(detail.info?.name || 'Wallet');
      const id = String(detail.info?.uuid || detail.info?.rdns || name || found.size);
      found.set(id, {
        id,
        name,
        icon: typeof detail.info?.icon === 'string' ? detail.info.icon : undefined,
        provider,
        kind: 'injected',
        readyState: 'Detected'
      });
    };
    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    window.removeEventListener('eip6963:announceProvider', handler);
  }

  if (found.size === 0) {
    const ethereum = (globalThis as any).ethereum;
    const providers = Array.isArray(ethereum?.providers) ? ethereum.providers : ethereum ? [ethereum] : [];
    providers.forEach((provider: Eip1193Provider, index: number) => {
      const name = injectedWalletName(provider);
      found.set(`injected:${name}:${index}`, {
        id: `injected:${name}:${index}`,
        name,
        provider,
        kind: 'injected',
        readyState: 'Detected'
      });
    });
  }

  const wallets: EvmWalletInfo[] = [
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      kind: 'walletconnect',
      readyState: 'Detected'
    },
    ...Array.from(found.values())
  ];
  const normalized = new Set(wallets.map((wallet) => wallet.name.toLowerCase().replace(/\s+/g, '')));
  KNOWN_WALLETS.forEach((wallet) => {
    const key = wallet.name.toLowerCase().replace(/\s+/g, '');
    if (normalized.has(key)) return;
    wallets.push({
      id: `install:${key}`,
      name: wallet.name,
      kind: 'injected',
      readyState: 'NotDetected',
      installUrl: wallet.installUrl
    });
  });
  return wallets;
}

function watchProvider(provider: Eip1193Provider, kind: EvmWalletConnection['kind'] = 'injected'): void {
  if (!provider.on || watchedProviders.has(provider as object)) return;
  watchedProviders.add(provider as object);
  provider.on('accountsChanged', (...args: any[]) => {
    const accounts = args[0] as string[] | undefined;
    connection.value = accounts?.[0] ? { address: accounts[0], provider, kind } : undefined;
  });
  provider.on('chainChanged', (...args: any[]) => {
    if (String(args[0]).toLowerCase() !== BASE_CHAIN_ID) connection.value = undefined;
  });
  const clearConnection = () => {
    if (connection.value?.provider === provider) connection.value = undefined;
  };
  provider.on('disconnect', clearConnection);
  if (kind === 'walletconnect') provider.on('session_delete', clearConnection);
}

export async function connectBaseWallet(provider: Eip1193Provider): Promise<EvmWalletConnection> {
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error('No EVM wallet account is available');
  const chainId = String(await provider.request({ method: 'eth_chainId' })).toLowerCase();
  if (chainId !== BASE_CHAIN_ID) {
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BASE_CHAIN_ID }] });
    } catch {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: BASE_CHAIN_ID,
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          }
        ]
      });
    }
  }
  connection.value = { address, provider, kind: 'injected' };
  watchProvider(provider);
  return connection.value;
}

export async function connectBaseWalletConnect(onUri: (uri: string) => void): Promise<EvmWalletConnection> {
  const { default: UniversalProvider } = await import('@walletconnect/universal-provider');
  const provider = (await UniversalProvider.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Nexior',
      description: 'Nexior Base USDC payments',
      url: typeof window === 'undefined' ? 'https://studio.acedata.cloud' : window.location.origin,
      icons: ['https://studio.acedata.cloud/favicon.ico']
    }
  })) as unknown as Eip1193Provider & {
    connect(options: unknown): Promise<unknown>;
    on(event: string, listener: (...args: any[]) => void): void;
  };
  provider.on('display_uri', onUri);
  await provider.connect({
    namespaces: {
      eip155: {
        methods: ['eth_accounts', 'eth_chainId', 'eth_signTypedData_v4'],
        chains: [BASE_CAIP_CHAIN],
        events: ['accountsChanged', 'chainChanged'],
        rpcMap: {
          8453: `https://rpc.walletconnect.org?chainId=${BASE_CAIP_CHAIN}&projectId=${WALLETCONNECT_PROJECT_ID}`
        }
      }
    }
  });
  const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error('No EVM wallet account is available');
  connection.value = { address, provider, kind: 'walletconnect' };
  watchProvider(provider, 'walletconnect');
  return connection.value;
}

export async function disconnectBaseWallet(): Promise<void> {
  const current = connection.value;
  connection.value = undefined;
  if (current?.kind === 'walletconnect') await current.provider.disconnect?.();
}
