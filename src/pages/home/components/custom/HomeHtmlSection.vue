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
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-else class="tenant-home-content" v-html="section.body"></div>
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
  homeHtmlIframeHeight
} from '@/utils/homeHtmlIframe';

const props = defineProps<{ section: ISiteHomeSection }>();
const frame = ref<HTMLIFrameElement>();
const frameHeight = ref(HOME_HTML_IFRAME_MIN_HEIGHT);
const iframeDocument = computed(() => buildHomeHtmlIframeDocument(props.section.body));

const onMessage = (event: MessageEvent): void => {
  if (event.source !== frame.value?.contentWindow) return;
  const height = homeHtmlIframeHeight(event.data);
  if (height !== null) frameHeight.value = height;
};
const requestHeight = (): void => {
  frame.value?.contentWindow?.postMessage({ type: HOME_HTML_IFRAME_MEASURE_MESSAGE }, '*');
};

watch(
  () => props.section.body,
  () => {
    frameHeight.value = HOME_HTML_IFRAME_MIN_HEIGHT;
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
