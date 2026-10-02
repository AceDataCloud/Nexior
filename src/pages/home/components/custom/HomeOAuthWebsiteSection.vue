<template>
  <article class="tenant-home-block tenant-home-oauth">
    <h2>{{ section.title }}</h2>
    <p v-if="!config" role="alert">{{ $t('site.homeSections.oauth.invalid') }}</p>
    <template v-else>
      <p v-if="!accessToken" class="oauth-login">
        <el-button type="primary" @click="login">{{ $t('site.homeSections.oauth.login') }}</el-button>
      </p>
      <div class="oauth-frame-region">
        <iframe
          :key="appKey"
          ref="appFrame"
          v-show="!pending"
          :src="appUrl"
          :title="section.title"
          :sandbox="HOME_OAUTH_APP_SANDBOX"
          :style="frameStyle"
          referrerpolicy="no-referrer"
          @load="initializeApp"
        />
        <iframe
          v-if="pending"
          ref="authFrame"
          :src="authorizeUrl"
          :title="$t('site.homeSections.oauth.authorization')"
          sandbox="allow-scripts allow-same-origin"
          :style="frameStyle"
          referrerpolicy="origin"
        />
      </div>
      <el-button v-if="pending" class="oauth-cancel" @click="finish({ error: 'access_denied' })">
        {{ $t('site.homeSections.oauth.cancel') }}
      </el-button>
      <a :href="section.body" target="_blank" rel="noopener noreferrer">
        {{ $t('site.homeSections.websiteOpenExternal', { host: config.origin }) }}
      </a>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { ElButton } from 'element-plus';
import type { ISiteHomeSection } from '@/models';
import type { HomeTheme } from '@/utils/homeHtmlIframe';
import { normalizeHomeLocale } from '@/utils/homeHtmlIframe';
import { getBaseUrlAuth } from '@/utils/baseUrl';
import {
  getHomeOAuthConfig,
  HOME_OAUTH_APP_SANDBOX,
  HOME_OAUTH_SCOPE,
  homeOAuthAuthorizeUrl,
  parseHomeOAuthRequest
} from '@/utils/homeOAuth';
import type { HomeOAuthRequest } from '@/utils/homeOAuth';

const props = defineProps<{ section: ISiteHomeSection; locale?: string; theme?: HomeTheme }>();
const store = useStore();
const appFrame = ref<HTMLIFrameElement>();
const authFrame = ref<HTMLIFrameElement>();
const pending = ref<HomeOAuthRequest | null>(null);
const config = computed(() => getHomeOAuthConfig(props.section, window.location.origin));
const accessToken = computed(() => store.getters.token?.access as string | undefined);
const userId = computed(() => store.getters.user?.id || store.state.user?.id || 'guest');
const appKey = computed(() => JSON.stringify([userId.value, !!accessToken.value, config.value, props.section.body]));
const authOrigin = new URL(getBaseUrlAuth()).origin;
const authorizeUrl = computed(() =>
  config.value && pending.value
    ? homeOAuthAuthorizeUrl(authOrigin, config.value, pending.value, window.location.origin)
    : ''
);
const appUrl = computed(() => {
  const url = new URL(props.section.body);
  url.searchParams.set('lang', normalizeHomeLocale(props.locale || 'en'));
  url.searchParams.set('theme', props.theme || 'light');
  return url.toString();
});
const frameStyle = computed(() => ({
  height: `${Math.max(props.section.height || 640, pending.value ? 640 : 160)}px`
}));
let timeout: ReturnType<typeof setTimeout> | undefined;
let sessionSent = false;

const postToApp = (data: Record<string, unknown>) => {
  if (config.value) appFrame.value?.contentWindow?.postMessage(data, config.value.origin);
};
const initializeApp = () => {
  if (!config.value) return;
  postToApp({
    type: 'acedatacloud:oauth:init',
    client_id: config.value.client_id,
    redirect_uri: config.value.redirect_uri,
    scope: HOME_OAUTH_SCOPE
  });
};
const clearPending = () => {
  if (timeout) clearTimeout(timeout);
  pending.value = null;
  sessionSent = false;
};
const finish = (result: { code?: string; error?: string }) => {
  if (!pending.value || !config.value) return;
  postToApp({
    type: 'acedatacloud:oauth:result',
    state: pending.value.state,
    redirect_uri: config.value.redirect_uri,
    ...result
  });
  clearPending();
};
const login = () => store.dispatch('login');
const onMessage = (event: MessageEvent) => {
  const data = event.data;
  if (!config.value || !data || typeof data !== 'object') return;
  if (event.origin === config.value.origin && event.source === appFrame.value?.contentWindow) {
    if (data.type === 'acedatacloud:oauth:ready') {
      initializeApp();
      return;
    }
    const request = parseHomeOAuthRequest(data);
    if (!request || pending.value) return;
    if (!accessToken.value) {
      postToApp({ type: 'acedatacloud:oauth:result', state: request.state, error: 'login_required' });
      return;
    }
    pending.value = request;
    timeout = setTimeout(() => finish({ error: 'authorization_timeout' }), 5 * 60 * 1000);
    return;
  }
  if (
    event.origin !== authOrigin ||
    event.source !== authFrame.value?.contentWindow ||
    !pending.value ||
    data.state !== pending.value.state
  )
    return;
  if (data.type === 'acedatacloud:oauth:session-ready' && !sessionSent && accessToken.value) {
    sessionSent = true;
    // Only the fixed AuthFrontend origin receives this first-party session.
    authFrame.value?.contentWindow?.postMessage(
      { type: 'acedatacloud:oauth:session', state: pending.value.state, access_token: accessToken.value },
      authOrigin
    );
  } else if (data.type === 'acedatacloud:oauth:result') {
    if (data.redirect_uri !== config.value.redirect_uri) return;
    if (typeof data.code === 'string' && data.code) finish({ code: data.code });
    else if (typeof data.error === 'string') finish({ error: data.error });
  }
};
watch(appKey, clearPending);
onMounted(() => window.addEventListener('message', onMessage));
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage);
  clearPending();
});
</script>

<style scoped>
.oauth-frame-region iframe {
  display: block;
  width: 100%;
  border: 0;
  border-radius: 12px;
  background: var(--el-bg-color);
}
.oauth-login,
.oauth-cancel {
  margin-bottom: 16px;
}
.tenant-home-oauth > a {
  display: inline-block;
  margin-top: 12px;
  color: var(--el-color-primary);
}
</style>
