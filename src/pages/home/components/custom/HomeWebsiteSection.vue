<template>
  <article class="tenant-home-block tenant-home-website">
    <h2>{{ section.title }}</h2>
    <!-- Never add allow-same-origin: embedded sites must not inherit the parent session. -->
    <iframe
      class="tenant-home-content tenant-home-website-frame"
      :src="section.body"
      :title="section.title"
      :sandbox="HOME_HTML_IFRAME_SANDBOX"
      loading="lazy"
      referrerpolicy="no-referrer"
    />
    <a class="tenant-home-website-link" :href="section.body" target="_blank" rel="noopener noreferrer">
      {{ $t('site.homeSections.websiteOpenExternal', { host }) }}
    </a>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ISiteHomeSection } from '@/models';
import { HOME_HTML_IFRAME_SANDBOX } from '@/utils/homeHtmlIframe';

const props = defineProps<{ section: ISiteHomeSection }>();
const host = computed(() => {
  try {
    return new URL(props.section.body).hostname;
  } catch {
    return props.section.body;
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
.tenant-home-website-link {
  display: inline-flex;
  margin-top: 12px;
  color: var(--el-color-primary);
}
@media (max-width: 760px) {
  .tenant-home-website-frame {
    height: 70vh;
  }
}
</style>
