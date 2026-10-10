<template>
  <article class="tenant-home-block tenant-home-website">
    <h2>{{ section.title }}</h2>
    <!-- Never add allow-same-origin: embedded sites must not inherit the parent session. -->
    <iframe
      v-if="url"
      class="tenant-home-content tenant-home-website-frame"
      :src="url"
      :title="section.title"
      :sandbox="HOME_HTML_IFRAME_SANDBOX"
      :style="section.height ? { height: `${section.height}px` } : undefined"
      loading="lazy"
      referrerpolicy="no-referrer"
    />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ISiteHomeSection } from '@/models';
import { HOME_HTML_IFRAME_SANDBOX, normalizeHomeLocale } from '@/utils/homeHtmlIframe';
import type { HomeTheme } from '@/utils/homeHtmlIframe';

const props = defineProps<{ section: ISiteHomeSection; locale?: string; theme?: HomeTheme }>();
const url = computed(() => {
  try {
    const target = new URL(props.section.body);
    if (target.protocol !== 'https:' && target.protocol !== 'http:') return '';
    target.searchParams.set('lang', normalizeHomeLocale(props.locale || 'en'));
    target.searchParams.set('theme', props.theme || 'light');
    return target.toString();
  } catch {
    return '';
  }
});
</script>

<style scoped>
.tenant-home-website-frame {
  display: block;
  width: 100%;
  height: clamp(360px, 65vh, 760px);
  border: 0;
  border-radius: 12px;
  background: var(--el-bg-color);
}
@media (max-width: 760px) {
  .tenant-home-website-frame {
    height: 70vh;
  }
}
</style>
