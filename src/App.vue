<template>
  <el-config-provider :locale="epLocale">
    <auth-panel v-if="authPopup" />
    <router-view />
    <el-tag v-if="isTest" size="large" class="fixed bottom-4 right-4 z-50" type="warning">
      {{ $t('index.button.testEnv') }}
    </el-tag>
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElConfigProvider, ElTag } from 'element-plus';
import AuthPanel from './components/common/AuthPanel.vue';
import { isTest } from '@/constants/endpoint';
import { getLocale } from './i18n';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { ElMessage } from 'element-plus';
import { isNative, isDesktop } from '@/utils/surface';
import { desktopBridge } from '@/utils/desktop';
import { parseInviterFromDeepLink, writeInviterCookie } from '@/utils/attribution';
import { exchangeSsoCode } from '@/utils/auth/exchangeSsoCode';

const elementPlusLocaleMap: Record<string, () => Promise<any>> = {
  en: () => import('element-plus/es/locale/lang/en'),
  de: () => import('element-plus/es/locale/lang/de'),
  pt: () => import('element-plus/es/locale/lang/pt'),
  es: () => import('element-plus/es/locale/lang/es'),
  fr: () => import('element-plus/es/locale/lang/fr'),
  'zh-CN': () => import('element-plus/es/locale/lang/zh-cn'),
  'zh-TW': () => import('element-plus/es/locale/lang/zh-tw'),
  it: () => import('element-plus/es/locale/lang/it'),
  ko: () => import('element-plus/es/locale/lang/ko'),
  ja: () => import('element-plus/es/locale/lang/ja'),
  ru: () => import('element-plus/es/locale/lang/ru'),
  pl: () => import('element-plus/es/locale/lang/pl'),
  fi: () => import('element-plus/es/locale/lang/fi'),
  sv: () => import('element-plus/es/locale/lang/sv'),
  el: () => import('element-plus/es/locale/lang/el'),
  uk: () => import('element-plus/es/locale/lang/uk'),
  ar: () => import('element-plus/es/locale/lang/ar'),
  sr: () => import('element-plus/es/locale/lang/sr')
};

export default defineComponent({
  name: 'App',
  components: {
    ElConfigProvider,
    ElTag,
    AuthPanel
  },
  data() {
    return {
      isTest,
      epLocale: null as any,
      // Desktop IPC listener detach handles (set in mounted on desktop only).
      offAuthCb: null as null | (() => void),
      offAuthExpired: null as null | (() => void),
      offSiteWatch: null as null | (() => void)
    };
  },
  computed: {
    authPopup() {
      return this.$store.state.auth.flow === 'popup' && this.$store.state.auth.visible;
    },
    currentLocale(): string {
      return getLocale(this.$i18n.locale as string);
    }
  },
  watch: {
    currentLocale: {
      immediate: true,
      handler() {
        this.loadElementPlusLocale();
      }
    }
  },
  mounted() {
    // Listen for deep link callbacks from the native (Capacitor) OAuth flow.
    if (isNative()) {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        console.debug('deep link received:', url);
        // Universal Link / App Link invite (installed-app case): an
        // https://studio.acedata.cloud/i/<inviter_id> tap opens the app here
        // instead of hitting the server. Capture the inviter so the login
        // panel binds the referral. (Deferred/new-install attribution is
        // handled separately in resolveDeferredInviterId at first launch.)
        const deepLinkInviter = parseInviterFromDeepLink(url);
        if (deepLinkInviter) {
          writeInviterCookie(deepLinkInviter);
        }
        // Expected format: com.acedatacloud.nexior://auth/callback?code=XXX
        if (url.includes('auth/callback')) {
          const code = new URL(url).searchParams.get('code');
          if (code) {
            // Browser.close() stays in the native caller — desktop has no
            // Capacitor in-app browser, so it can't live in the shared util.
            try {
              await Browser.close();
            } catch (e) {
              console.debug('browser close failed (may already be closed)', e);
            }
            await exchangeSsoCode(code, { store: this.$store, router: this.$router, source: 'native' });
          }
        }
      });
    }

    // Desktop (Electron) deep link: the main process has ALREADY validated the
    // OAuth `state` nonce, so we only receive `code`. Subscribe FIRST, then
    // signal readiness so main flushes any deep link queued during cold start.
    if (isDesktop()) {
      const bridge = desktopBridge();
      this.offAuthCb =
        bridge?.onAuthCallback(({ code }) => {
          void exchangeSsoCode(code, { store: this.$store, router: this.$router, source: 'desktop' });
        }) ?? null;
      this.offAuthExpired =
        bridge?.onAuthExpired(() => {
          ElMessage.error(this.$t('common.error.loginLinkExpired').toString());
        }) ?? null;
      bridge?.signalReady();
      // Feed the signed-in site origin to main's external-open allowlist.
      this.offSiteWatch = this.$watch(
        () => this.$store.state.site?.origin as string | undefined,
        (origin) => {
          if (origin) bridge?.setSiteOrigin(origin);
        },
        { immediate: true }
      );
    }

    const authenticated = !!this.$store.state.token.access && !!this.$store.state.user?.id;
    console.debug('App mounted, authenticated:', authenticated);
    if (!authenticated) {
      if (isNative() || isDesktop()) {
        // On native AND desktop, just reset state and show the in-app login
        // popup. Don't dispatch 'logout' which would navigate the window to an
        // external auth URL — on desktop the app://bundle window can't return.
        this.$store.dispatch('resetAll');
        this.$store.dispatch('login');
      } else {
        // Don't dispatch 'logout' here — there's nothing to log out from when
        // the user isn't authenticated, and 'logout' races with 'login' for
        // window.location.href. Because 'logout' has many awaits, it would win
        // the race and overwrite 'login's properly-encoded URL with a raw
        // string-concatenated one, causing inviter_id to end up nested inside
        // the redirect= value where AuthFrontend can't find it. This silently
        // breaks the referral binding for users who arrive via share links on
        // custom-domain (white-label) deployments.
        this.$store.dispatch('resetAll');
        this.$store.dispatch('login');
      }
    }
  },
  beforeUnmount() {
    // Detach desktop IPC listeners + the site-origin watcher.
    this.offAuthCb?.();
    this.offAuthExpired?.();
    this.offSiteWatch?.();
  },
  methods: {
    async loadElementPlusLocale() {
      const localeCode = this.currentLocale;
      console.debug(`[i18n] Loading Element Plus locale for: ${localeCode}`);

      const loader = elementPlusLocaleMap[localeCode];
      if (!loader) {
        console.warn(`[i18n] No Element Plus locale found for: ${localeCode}`);
        return;
      }

      try {
        const module = await loader();
        this.epLocale = module.default;
        console.debug(`[i18n] Loaded Element Plus locale: ${localeCode}`);
      } catch (err) {
        console.error(`[i18n] Failed to load Element Plus locale for: ${localeCode}`, err);
      }
    }
  }
});
</script>
