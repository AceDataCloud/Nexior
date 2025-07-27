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
    const authenticated = !!this.$store.state.token.access && !!this.$store.state.user?.id;
    console.debug('App mounted, authenticated:', authenticated);
    if (!authenticated) {
      this.$store.dispatch('logout');
      this.$store.dispatch('login');
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
