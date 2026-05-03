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
import { ssoOperator } from '@/operators';

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
      epLocale: null as any
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
    // Listen for deep link callbacks from native OAuth flow
    if (import.meta.env.VITE_SURFACE === 'android' || import.meta.env.VITE_SURFACE === 'ios') {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        console.debug('deep link received:', url);
        // Expected format: com.acedatacloud.nexior://auth/callback?code=XXX
        if (url.includes('auth/callback')) {
          const params = new URL(url).searchParams;
          const code = params.get('code');
          if (code) {
            try {
              await Browser.close();
            } catch (e) {
              console.debug('browser close failed (may already be closed)', e);
            }
            try {
              const { data } = await ssoOperator.token({ code });
              const token = {
                access: data.access_token,
                refresh: data.refresh_token,
                expiration: data.expires_in
              };
              await this.$store.dispatch('setToken', token);
              await this.$store.dispatch('getUser');
              this.$store.commit('setAuth', { visible: false });
              await this.$router.push('/');
            } catch (e) {
              console.error('token exchange failed after deep link', e);
              this.$store.commit('setAuth', { visible: false });
              await this.$store.dispatch('login');
            }
          }
        }
      });
    }

    const authenticated = !!this.$store.state.token.access && !!this.$store.state.user?.id;
    console.debug('App mounted, authenticated:', authenticated);
    if (!authenticated) {
      if (import.meta.env.VITE_SURFACE === 'android' || import.meta.env.VITE_SURFACE === 'ios') {
        // On native platforms, just reset state and show login popup.
        // Don't dispatch 'logout' which would navigate the WebView to an
        // external auth URL, opening Chrome and landing on localhost.
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
