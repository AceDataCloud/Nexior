import type { App } from 'vue';

export async function installSolanaWallets(app: App): Promise<void> {
  const [
    { default: SolanaWallets },
    { WalletAdapterNetwork },
    { PhantomWalletAdapter },
    { SolflareWalletAdapter },
    { NightlyWalletAdapter },
    { WalletConnectWalletAdapter }
  ] = await Promise.all([
    import('solana-wallets-vue'),
    import('@solana/wallet-adapter-base'),
    import('@solana/wallet-adapter-phantom'),
    import('@solana/wallet-adapter-solflare'),
    import('@solana/wallet-adapter-nightly'),
    import('@solana/wallet-adapter-walletconnect')
  ]);

  // Load the CSS
  await import('solana-wallets-vue/styles.css');

  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8442ba82a50e5d4a993fc9d82ba15c59';

  const walletOptions = {
    wallets: [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
      new NightlyWalletAdapter(),
      new WalletConnectWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          projectId: walletConnectProjectId,
          metadata: {
            name: 'AceData',
            description: 'AceData WalletConnect',
            url: window.location.origin,
            icons: ['https://cdn.acedata.cloud/acedata.jpg']
          }
        }
      })
    ]
  };

  app.use(SolanaWallets, walletOptions);
}
