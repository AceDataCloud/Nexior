<template>
  <article class="tenant-home-block tenant-home-cta">
    <span v-if="section.subtitle" class="tenant-home-eyebrow">{{ section.subtitle }}</span>
    <h2>{{ section.title }}</h2>
    <p v-if="section.body">{{ section.body }}</p>
    <home-section-link :href="section.button_url" class="tenant-home-action">
      {{ section.button_label }} <span aria-hidden="true">→</span>
    </home-section-link>
  </article>
</template>

<script setup lang="ts">
import type { ISiteHomeSection } from '@/models';
import HomeSectionLink from './HomeSectionLink.vue';

defineProps<{ section: ISiteHomeSection }>();
</script>
