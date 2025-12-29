import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';
import 'solana-wallets-vue/styles.css';
import SolanaWallets from 'solana-wallets-vue';
import { MotionPlugin } from '@vueuse/motion';
import { vLoading } from 'element-plus';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  NightlyWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  WalletConnectWalletAdapter
} from '@solana/wallet-adapter-wallets';
import {
  initializeCookies,
  initializeDescription,
  initializeFavicon,
  initializeTheme,
  initializeToken,
  initializeUser,
  initializeKeywords,
  initializeSite,
  initializeConfig,
  initializeTitle,
  initializeCurrency,
  initializeExchangeRate,
  initializeRedirect,
  initializeFingerprint
} from './utils/initializer';

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
          name: 'Nexior',
          description: 'Nexior WalletConnect',
          url: window.location.origin,
          icons: ['https://cdn.acedata.cloud/acedata.jpg']
        }
      }
    })
  ]
};

const main = async () => {
  // async and need to await
  const isRedirected = await initializeRedirect();
  if (isRedirected) {
    // if redirected, stop initialization
    return;
  }
  await initializeCookies();
  await initializeToken();
  await initializeUser();
  await initializeSite();
  await initializeConfig();

  // non-async and no need to await
  initializeCurrency();
  initializeTheme();
  initializeExchangeRate();
  initializeTitle();
  initializeDescription();
  initializeKeywords();
  initializeFavicon();
  initializeFingerprint();

  const app = createApp(App);

  app.use(router);
  app.use(store);
  app.use(i18n);
  app.use(MotionPlugin);
  app.use(SolanaWallets, walletOptions);
  app.use(dayjs, {
    formatString: 'YYYY-MM-DD HH:mm:ss'
  });
  app.directive('loading', vLoading);
  app.mount('#app');
  console.debug('app mounted');

  // make app available globally
  // @ts-ignore
  window.app = app;
};

main();
