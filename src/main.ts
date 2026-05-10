import { createApp } from 'vue';
import { Capacitor } from '@capacitor/core';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';
import { handleChunkLoadError, initializeChunkLoadErrorHandler } from './utils/chunkLoadError';
import { initTelemetry, setUser, captureError } from './plugins/telemetry';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';
import { MotionPlugin } from '@vueuse/motion';
import { vLoading } from 'element-plus';
import { getSurface, isNative } from '@/utils/surface';
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

const surface = getSurface();
document.documentElement.dataset.surface = surface;
document.documentElement.classList.add(`surface-${surface}`);
if (isNative()) {
  document.documentElement.classList.add('surface-native');
}

// `index.html` ships with `maximum-scale=1.0, user-scalable=0` so that
// Capacitor's WKWebView doesn't auto-zoom when an input field gains focus
// on iOS — a long-standing native-shell quirk. On the web (and Android
// Chrome) that flag has the unfortunate side-effect of disabling
// pinch-zoom, which fails WCAG 1.4.4 (Resize Text) and is the one piece
// of accessibility regression the audit flagged. Drop the zoom-lock at
// runtime when we're NOT running inside Capacitor; native shells keep it.
if (!Capacitor.isNativePlatform()) {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
  }
}

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

  // Telemetry: initialize after token+user so we already know who the visitor
  // is. Safe no-op when VITE_RUM_PROJECT_ID is unset (local dev / preview).
  // We don't `await` so a slow CDN can't block first paint.
  void initTelemetry({
    uin: store.getters.user?.id,
    release: import.meta.env.VITE_APP_VERSION as string | undefined
  });

  // non-async and no need to await
  initializeCurrency();
  initializeTheme();
  initializeExchangeRate();
  initializeTitle();
  initializeDescription();
  initializeKeywords();
  initializeFavicon();

  const app = createApp(App);

  // Vue render errors → RUM. Keep the existing console behavior so devs
  // still see the trace locally.
  app.config.errorHandler = (err, _instance, info) => {
    captureError(err, { source: 'vue', route: info });
    console.error('[vue:errorHandler]', err, info);
  };

  // Unhandled promise rejections → RUM. The browser already logs these,
  // we just attach them to the same dashboard.
  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, { source: 'unhandledrejection' });
  });

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
    // Once the fingerprint resolves, attach it to the RUM session as the
    // anonymous id (`aid`). This lets pre-login activity for the same device
    // be threaded together in the dashboard.
    setUser(store.getters.user?.id, store.getters.fingerprint);
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
