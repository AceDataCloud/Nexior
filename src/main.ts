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

// Pick up `?features=...` overrides and persist them to the FEATURES
// cookie before anything else runs — router guards / store hydration /
// component setup all consult `isFeatureEnabled()` synchronously.
syncFeaturesFromUrl();

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

  // Native-only version gate: block the app behind an upgrade modal when
  // the shipped build is below `min_supported`. Web is always served the
  // latest dist/, so this is a no-op there. Fails open on any error so an
  // outage on /api/v1/app-version/ can never strand mobile users.
  if (isNative()) {
    const blocked = await runVersionGate();
    if (blocked) return;
  }

  // Native OTA: check the COS-hosted manifest for a newer JS bundle and
  // queue it for next launch. Fire-and-forget so a slow CDN can't delay
  // mount; also a no-op on web and when VITE_LIVE_UPDATE_ENABLED isn't
  // set. Internally still calls `notifyAppReady()` on every cold start so
  // previously-installed bundles don't get rolled back.
  void runLiveUpdate();

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
