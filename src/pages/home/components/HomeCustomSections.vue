<template>
  <section v-if="renderable.length && site" class="custom-sections">
    <component
      :is="componentByKind[section.kind]"
      v-for="section in renderable"
      :key="section.id"
      :section="section"
      :site="site"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import type { ISite, ISiteHomeSection, SiteHomeSectionKind } from '@/models';
import HomeCapabilityGridSection from './custom/HomeCapabilityGridSection.vue';
import HomeCtaSection from './custom/HomeCtaSection.vue';
import HomeImageTextSection from './custom/HomeImageTextSection.vue';
import HomeRichTextSection from './custom/HomeRichTextSection.vue';

const props = defineProps<{ sections: ISiteHomeSection[]; site?: ISite }>();
const componentByKind: Record<SiteHomeSectionKind, Component> = {
  image_text: HomeImageTextSection,
  cta: HomeCtaSection,
  capability_grid: HomeCapabilityGridSection,
  rich_text: HomeRichTextSection
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
  padding: clamp(24px, 4vw, 48px);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 65%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, transparent);
  box-shadow: 0 18px 55px rgb(0 0 0 / 12%);
}
.tenant-home-block h2 {
  margin: 6px 0 10px;
  font-size: clamp(24px, 3vw, 38px);
  line-height: 1.1;
}
.tenant-home-block p {
  max-width: 720px;
  margin: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}
.tenant-home-block .tenant-home-eyebrow {
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.tenant-home-link.tenant-home-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
  padding: 11px 18px;
  border-radius: 999px;
  color: var(--el-color-white);
  font-weight: 700;
  text-decoration: none;
  background: var(--el-color-primary);
}
.tenant-home-link.is-disabled {
  opacity: 0.55;
}
.tenant-home-image-text {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 42%);
  align-items: center;
  gap: 34px;
}
.tenant-home-image-text > img {
  width: 100%;
  max-height: 360px;
  border-radius: 14px;
  object-fit: cover;
}
.tenant-home-cta {
  text-align: center;
}
.tenant-home-cta p {
  margin-inline: auto;
}
.tenant-home-rich-text {
  max-width: 100%;
}
.tenant-home-rich-text :is(pre, table) {
  max-width: 100%;
  overflow-x: auto;
}
.tenant-home-capability-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.tenant-home-capability-item {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  background: var(--el-fill-color-light);
}
.tenant-home-capability-item img {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  object-fit: cover;
}
.tenant-home-capability-item span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.tenant-home-capability-item strong,
.tenant-home-capability-item small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tenant-home-capability-item small {
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .tenant-home-capability-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .tenant-home-image-text {
    grid-template-columns: 1fr;
  }
  .tenant-home-capability-grid {
    grid-template-columns: 1fr;
  }
  .tenant-home-link.tenant-home-action {
    width: 100%;
    min-height: 44px;
    justify-content: center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tenant-home-block,
  .tenant-home-link {
    scroll-behavior: auto;
    transition: none;
  }
}
</style>
