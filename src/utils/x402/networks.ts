/** Client wallet metadata. The request's 402 challenge decides payable rails. */
export const EVM_PAYMENT_NETWORKS = {
  base: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  },
  arbitrum: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon PoS',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpcUrls: ['https://polygon-bor-rpc.publicnode.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  optimism: {
    chainId: '0xa',
    chainName: 'OP Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io']
  }
};

export type EvmWalletRail = keyof typeof EVM_PAYMENT_NETWORKS;
export type WalletRail = EvmWalletRail | 'solana';

export function getEvmPaymentNetwork(network: string) {
  return Object.entries(EVM_PAYMENT_NETWORKS).find(
    ([alias, config]) => network === alias || network === `eip155:${parseInt(config.chainId, 16)}`
  )?.[1];
}

export function paymentNetworkForRail(rail: WalletRail): string {
  if (rail === 'solana') return 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  return `eip155:${parseInt(EVM_PAYMENT_NETWORKS[rail].chainId, 16)}`;
}

export function evmTransactionUrl(network: string, hash: string): string | undefined {
  const config = getEvmPaymentNetwork(network);
  if (!config || !/^0x[0-9a-fA-F]{64}$/.test(hash)) return undefined;
  return `${config.blockExplorerUrls[0]}/tx/${hash}`;
}

export function evmWalletRailForNetwork(network: string): EvmWalletRail | undefined {
  return Object.entries(EVM_PAYMENT_NETWORKS).find(
    ([alias, config]) => network === alias || network === `eip155:${parseInt(config.chainId, 16)}`
  )?.[0] as EvmWalletRail | undefined;
}

export function x402NetworkFeature(network: string): string | undefined {
  const key = network.toLowerCase();
  const alias = Object.entries(EVM_PAYMENT_NETWORKS).find(
    ([alias, config]) => key === alias || key === `eip155:${parseInt(config.chainId, 16)}`
  )?.[0];
  return alias && alias !== 'base' ? `x402-${alias}` : undefined;
}

export function x402NetworkFeatures(): string[] {
  return Object.keys(EVM_PAYMENT_NETWORKS)
    .filter((alias) => alias !== 'base')
    .map((alias) => `x402-${alias}`);
}
