<template>
  <section v-if="renderable.length" class="custom-sections">
    <component :is="componentByKind[section.kind]" v-for="section in renderable" :key="section.id" :section="section" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import type { ISite, ISiteHomeSection, SiteHomeSectionKind } from '@/models';
import HomeHtmlSection from './custom/HomeHtmlSection.vue';
import HomeMarkdownSection from './custom/HomeMarkdownSection.vue';
import HomeWebsiteSection from './custom/HomeWebsiteSection.vue';

const props = defineProps<{ sections: ISiteHomeSection[]; site?: ISite }>();
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
@media (prefers-reduced-motion: reduce) {
  .tenant-home-block {
    scroll-behavior: auto;
    transition: none;
  }
}
</style>
