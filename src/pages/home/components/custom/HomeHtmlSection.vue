<template>
  <article class="tenant-home-block tenant-home-html">
    <h2>{{ section.title }}</h2>
    <!-- Never add allow-same-origin: iframe scripts must not inherit the parent session. -->
    <iframe
      v-if="section.render_in_iframe"
      ref="frame"
      class="tenant-home-content tenant-home-iframe"
      :title="section.title"
      :sandbox="HOME_HTML_IFRAME_SANDBOX"
      :srcdoc="iframeDocument"
      :style="{ height: `${frameHeight}px` }"
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin"
      @load="requestHeight"
    />
    <!-- eslint-disable vue/no-v-html -->
    <div
      v-else
      class="tenant-home-content"
      :lang="normalizedLocale"
      :dir="direction"
      :data-lang="normalizedLocale"
      :data-theme="theme || 'light'"
      :style="section.height != null ? { height: `${section.height}px`, overflowY: 'auto' } : undefined"
      v-html="section.body"
    ></div>
    <!-- eslint-enable vue/no-v-html -->
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ISiteHomeSection } from '@/models';
import {
  buildHomeHtmlIframeDocument,
  HOME_HTML_IFRAME_MEASURE_MESSAGE,
  HOME_HTML_IFRAME_MIN_HEIGHT,
  HOME_HTML_IFRAME_SANDBOX,
  homeHtmlIframeHeight,
  normalizeHomeLocale,
  homeLocaleDirection
} from '@/utils/homeHtmlIframe';
import type { HomeTheme } from '@/utils/homeHtmlIframe';

const props = defineProps<{ section: ISiteHomeSection; locale?: string; theme?: HomeTheme }>();
const normalizedLocale = computed(() => normalizeHomeLocale(props.locale || 'en'));
const direction = computed(() => homeLocaleDirection(normalizedLocale.value));
const frame = ref<HTMLIFrameElement>();
const fixedHeight = computed(() => props.section.height ?? null);
const automaticHeight = computed(() => fixedHeight.value === null);
const frameHeight = ref(fixedHeight.value ?? HOME_HTML_IFRAME_MIN_HEIGHT);
const iframeDocument = computed(() =>
  buildHomeHtmlIframeDocument(props.section.body, normalizedLocale.value, automaticHeight.value, props.theme || 'light')
);

const onMessage = (event: MessageEvent): void => {
  if (!automaticHeight.value || event.source !== frame.value?.contentWindow) return;
  const height = homeHtmlIframeHeight(event.data);
  if (height !== null) frameHeight.value = height;
};
const requestHeight = (): void => {
  if (!automaticHeight.value) return;
  frame.value?.contentWindow?.postMessage({ type: HOME_HTML_IFRAME_MEASURE_MESSAGE }, '*');
};

watch(
  () => [props.section.body, props.section.height, props.locale, props.theme] as const,
  () => {
    frameHeight.value = fixedHeight.value ?? HOME_HTML_IFRAME_MIN_HEIGHT;
  }
);
onMounted(() => {
  window.addEventListener('message', onMessage);
  requestHeight();
});
onBeforeUnmount(() => window.removeEventListener('message', onMessage));
</script>

<style scoped>
.tenant-home-iframe {
  display: block;
  width: 100%;
  border: 0;
}
</style>
