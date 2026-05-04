import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';
import { handleChunkLoadError, initializeChunkLoadErrorHandler } from './utils/chunkLoadError';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';
import { MotionPlugin } from '@vueuse/motion';
import { vLoading } from 'element-plus';
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

initializeChunkLoadErrorHandler();

const main = async () => {
  // async and need to await
  const isRedirected = await initializeRedirect();
  if (isRedirected) {
    // if redirected, stop initialization
    return;
  }
  await initializeCookies();
  await initializeToken();
  // user/site/config are independent after token is set — run in parallel
  await Promise.all([initializeUser(), initializeSite(), initializeConfig()]);

  // non-async and no need to await
  initializeCurrency();
  initializeTheme();
  initializeExchangeRate();
  initializeTitle();
  initializeDescription();
  initializeKeywords();
  initializeFavicon();

  const app = createApp(App);

  app.use(router);
  app.use(store);
  app.use(i18n);
  app.use(MotionPlugin);
  app.use(dayjs, {
    formatString: 'YYYY-MM-DD HH:mm:ss'
  });
  app.directive('loading', vLoading);
  app.mount('#app');
  console.debug('app mounted');

  // Compute the visitor fingerprint after mount: `@fingerprintjs/fingerprintjs`
  // is ~30 KB and its `get()` call is synchronously expensive (canvas/audio/
  // font probes). Deferring keeps it out of the critical-path execution and
  // lets the browser pick an idle moment when available.
  const scheduleFingerprint = () => {
    initializeFingerprint();
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(scheduleFingerprint, { timeout: 4000 });
  } else {
    setTimeout(scheduleFingerprint, 1500);
  }

  // Lazy-load Solana wallets after mount to keep initial bundle small
  import('./plugins/solana-wallets').then(({ installSolanaWallets }) => {
    installSolanaWallets(app);
  });

  // make app available globally
  // @ts-ignore
  window.app = app;
};

main().catch((error) => {
  if (!handleChunkLoadError(error)) {
    console.error(error);
  }
});
