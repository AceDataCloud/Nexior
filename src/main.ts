import { ViteSSG } from 'vite-ssg';
import { Capacitor } from '@capacitor/core';
import App from './App.vue';
import { routes, setupRouterGuards, setActiveRouter } from './router';
import store from './store';
import i18n, { setI18nLanguage } from './i18n';
import { I18N_DEFAULT_LOCALE } from '@/constants/i18n';
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
import { resolveDeferredInviterId } from '@/utils/attribution';
import { syncFeaturesFromUrl } from '@/utils/featureFlag';
import { runVersionGate } from '@/utils/versionGate';
import { runLiveUpdate } from '@/utils/liveUpdate';
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

// vite-ssg entry. At build it pre-renders the flag-allowlisted routes with
// memory history; in the browser the same createApp hydrates/mounts the SPA.
// Everything that used to run at module top-level / in main() now runs behind
// isClient so the Node build render never touches window/document/Capacitor.
export const createApp = ViteSSG(App, { routes, base: import.meta.env.BASE_URL }, async ({ app, router, isClient }) => {
  app.use(store);
  app.use(i18n);
  app.use(MotionPlugin);
  app.use(dayjs, { formatString: 'YYYY-MM-DD HH:mm:ss' });
  app.directive('loading', vLoading);
  setupRouterGuards(router);
  setActiveRouter(router);

  app.config.errorHandler = (err, _instance, info) => {
    captureError(err, { source: 'vue', route: info });
    console.error('[vue:errorHandler]', err, info);
  };

  // Build-time render: load default-locale messages so $t resolves, then stop.
  if (!isClient) {
    await setI18nLanguage(I18N_DEFAULT_LOCALE);
    return;
  }

  // ---- client-only bootstrap (formerly module top-level + main()) ----
  syncFeaturesFromUrl();
  initializeChunkLoadErrorHandler();

  const surface = getSurface();
  document.documentElement.dataset.surface = surface;
  document.documentElement.classList.add(`surface-${surface}`);
  if (isNative()) {
    document.documentElement.classList.add('surface-native');
  }
  // Drop the iOS zoom-lock on web/Android (WCAG 1.4.4); native shells keep it.
  if (!Capacitor.isNativePlatform()) {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }
  }

  const isRedirected = await initializeRedirect();
  if (isRedirected) {
    return;
  }
  await initializeCookies();
  await resolveDeferredInviterId();
  await initializeToken();
  await Promise.all([initializeUser(), initializeSite(), initializeConfig()]);

  if (isNative()) {
    const blocked = await runVersionGate();
    if (blocked) return;
  }
  void runLiveUpdate();

  void initTelemetry({
    uin: store.getters.user?.id,
    release: import.meta.env.VITE_APP_VERSION as string | undefined
  });

  initializeCurrency();
  initializeTheme();
  initializeExchangeRate();
  initializeTitle();
  initializeDescription();
  initializeKeywords();
  initializeFavicon();

  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, { source: 'unhandledrejection' });
  });

  const scheduleFingerprint = () => {
    initializeFingerprint();
    setUser(store.getters.user?.id, store.getters.fingerprint);
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(scheduleFingerprint, { timeout: 4000 });
  } else {
    setTimeout(scheduleFingerprint, 1500);
  }

  import('./plugins/solana-wallets').then(({ installSolanaWallets }) => {
    installSolanaWallets(app);
  });

  // @ts-ignore
  window.app = app;
});

// Preserve the previous chunk-load-error fallback on the entry promise.
if (typeof window !== 'undefined') {
  Promise.resolve().catch((error) => {
    if (!handleChunkLoadError(error)) {
      console.error(error);
    }
  });
}
