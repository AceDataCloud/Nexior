<template>
  <section v-if="renderable.length" class="custom-sections">
    <component
      :is="section.kind === 'website' && section.oauth ? HomeOAuthWebsiteSection : componentByKind[section.kind]"
      v-for="section in renderable"
      :key="section.id"
      :section="section"
      :locale="section.kind === 'html' || section.kind === 'website' ? locale : undefined"
      :theme="section.kind === 'html' || section.kind === 'website' ? theme : undefined"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { Component } from 'vue';
import type { ISite, ISiteHomeSection, SiteHomeSectionKind } from '@/models';
import type { HomeTheme } from '@/utils/homeHtmlIframe';
import HomeHtmlSection from './custom/HomeHtmlSection.vue';
import HomeMarkdownSection from './custom/HomeMarkdownSection.vue';
import HomeWebsiteSection from './custom/HomeWebsiteSection.vue';
import HomeOAuthWebsiteSection from './custom/HomeOAuthWebsiteSection.vue';

const props = defineProps<{ sections: ISiteHomeSection[]; site?: ISite; locale?: string }>();
const effectiveTheme = (): HomeTheme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
const theme = ref<HomeTheme>(effectiveTheme());
let themeObserver: MutationObserver | undefined;
onMounted(() => {
  theme.value = effectiveTheme();
  themeObserver = new MutationObserver(() => {
    theme.value = effectiveTheme();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});
onBeforeUnmount(() => themeObserver?.disconnect());
const componentByKind: Record<SiteHomeSectionKind, Component> = {
  markdown: HomeMarkdownSection,
  html: HomeHtmlSection,
  website: HomeWebsiteSection
};
const renderable = computed(() => props.sections.filter((section) => componentByKind[section.kind]));
</script>

<style lang="scss">
.custom-sections {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding-top: 34px;
}
.tenant-home-block {
  overflow: hidden;
  max-width: 100%;
  padding: clamp(24px, 4vw, 48px);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 65%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, transparent);
  box-shadow: 0 18px 55px rgb(0 0 0 / 12%);
}
.tenant-home-block h2 {
  margin: 6px 0 18px;
  font-size: clamp(24px, 3vw, 38px);
  line-height: 1.1;
}
.tenant-home-content :is(pre, table) {
  max-width: 100%;
  overflow-x: auto;
}
.tenant-home-open-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  margin-top: 12px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
}
.tenant-home-open-button:hover,
.tenant-home-open-button:focus-visible {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
@media (prefers-reduced-motion: reduce) {
  .tenant-home-block {
    scroll-behavior: auto;
    transition: none;
  }
}
</style>
