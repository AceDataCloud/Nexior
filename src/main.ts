import { ViteSSG } from 'vite-ssg';
import { Capacitor } from '@capacitor/core';
import App from './App.vue';
import { routes, setupRouterGuards, setActiveRouter } from './router';
import store from './store';
import i18n, { setBrandSiteResolver, setI18nLanguage } from './i18n';
import { I18N_DEFAULT_LOCALE } from '@/constants/i18n';
import { getCookie, setCookie } from 'typescript-cookie';
import { handleChunkLoadError, initializeChunkLoadErrorHandler } from './utils/chunkLoadError';
import { initTelemetry, setUser, captureError } from './plugins/telemetry';
import '@acedatacloud/core/styles.css';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import '@acedatacloud/core/controls.css';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';
import { MotionPlugin } from '@vueuse/motion';
import { vLoading } from 'element-plus';
import CapabilityPresentation from '@/components/common/CapabilityPresentation.vue';
import { getSurface, isNative, isDesktop, isMacOS, isWindows } from '@/utils/surface';
import { resolveDeferredInviterId } from '@/utils/attribution';
import { getDomain } from '@/utils';
import { resolveBootLocaleCookie } from '@/utils/siteLocales';
import { syncFeaturesFromUrl } from '@/utils/featureFlag';
import { initializeSiteAnalytics } from '@/utils/siteAnalytics';
import { runVersionGate } from '@/utils/versionGate';
import { runLiveUpdate } from '@/utils/liveUpdate';
import { configureRequestAuth, installServiceRequestAuthGuard, isAuthTransitionError } from '@/utils/requestAuth';
import { ensureLoggedIn } from '@/utils/login';
import { initializeLocalizedBootstrap } from '@/utils/localizedBootstrap';
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

setBrandSiteResolver(() => store.state.site);

const applyBootLocale = async (site?: Parameters<typeof resolveBootLocaleCookie>[1]) => {
  const savedLocale = getCookie('LOCALE');
  const { locale, shouldPersist } = resolveBootLocaleCookie(savedLocale, site);
  if (!shouldPersist) return false;
  await setI18nLanguage(locale);
  setCookie('LOCALE', locale, { path: '/', domain: getDomain() });
  return true;
};

// vite-ssg entry. At build it pre-renders the flag-allowlisted routes with
// memory history; in the browser the same createApp hydrates/mounts the SPA.
// Everything that used to run at module top-level / in main() now runs behind
// isClient so the Node build render never touches window/document/Capacitor.
export const createApp = ViteSSG(App, { routes, base: import.meta.env.BASE_URL }, async ({ app, router, isClient }) => {
  app.use(store);
  app.use(i18n);
  app.use(MotionPlugin);
  app.use(dayjs, { formatString: 'YYYY-MM-DD HH:mm:ss' });
  app.component('CapabilityPresentation', CapabilityPresentation);
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
  configureRequestAuth({
    getAccountToken: () => store.state.token?.access,
    isAuthenticated: () => store.getters.authenticated,
    triggerLogin: () => {
      ensureLoggedIn();
    }
  });
  installServiceRequestAuthGuard();
  syncFeaturesFromUrl();
  initializeChunkLoadErrorHandler();

  const surface = getSurface();
  document.documentElement.dataset.surface = surface;
  document.documentElement.classList.add(`surface-${surface}`);
  if (isNative()) {
    document.documentElement.classList.add('surface-native');
  }
  // Desktop OS marker for CSS. Traffic-light vs Windows-controls layout differs
  // enough (left-side inset vs right-side overlay) that per-OS rules are simpler
  // than a runtime CSS var. Safe: isMacOS/isWindows return false off-desktop.
  if (isDesktop()) {
    if (isMacOS()) document.documentElement.classList.add('is-mac');
    if (isWindows()) document.documentElement.classList.add('is-win');
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
  // Android-only (full/sideload flavor): install the `window.localExec` bridge
  // (Computer Use) so the shared aichat2 chat loop can drive phone-side
  // `computer.*` tools, like the desktop Electron bridge. No-op on web/iOS/
  // desktop. Compiled out of the Google Play build (VITE_COMPUTER_USE=false),
  // which drops mobileLocalExec + the AccessibilityService plugin entirely.
  if (import.meta.env.VITE_COMPUTER_USE !== 'false') {
    const { installMobileLocalExec } = await import('@/utils/mobileLocalExec');
    installMobileLocalExec();
  }
  await initializeCookies();
  // Normalize stale cookies before bootstrap requests use them as
  // Accept-Language, then apply the site's locale policy after it loads.
  await applyBootLocale();
  await resolveDeferredInviterId();
  await initializeToken();
  await initializeLocalizedBootstrap({
    initializeSite,
    applySiteLocale: () => applyBootLocale(store.state.site),
    initializeUser,
    initializeConfig
  });

  if (isNative() || isDesktop()) {
    const blocked = await runVersionGate();
    if (blocked) return;
  }
  void runLiveUpdate();
  initializeSiteAnalytics(store.state.site || undefined);

  void initTelemetry({
    uin: store.getters.user?.id,
    // __APP_VERSION__ is injected by vite.config `define` for all surfaces.
    // (Previously this read import.meta.env.VITE_APP_VERSION, which was never
    // defined anywhere → the telemetry release tag was always undefined.)
    release: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : undefined
  });

  initializeCurrency();
  initializeTheme();
  initializeExchangeRate();
  initializeTitle();
  initializeDescription();
  initializeKeywords();
  initializeFavicon();

  window.addEventListener('unhandledrejection', (event) => {
    if (isAuthTransitionError(event.reason)) return;
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
