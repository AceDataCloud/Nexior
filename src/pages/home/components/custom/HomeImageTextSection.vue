<template>
  <article class="tenant-home-block tenant-home-image-text">
    <div class="tenant-home-copy">
      <span v-if="section.subtitle" class="tenant-home-eyebrow">{{ section.subtitle }}</span>
      <h2>{{ section.title }}</h2>
      <p v-if="section.body">{{ section.body }}</p>
      <home-section-link v-if="section.button_label" :href="section.button_url" class="tenant-home-action">
        {{ section.button_label }} <span aria-hidden="true">→</span>
      </home-section-link>
    </div>
    <img
      v-if="section.image_url && !imageFailed"
      :src="section.image_url"
      :alt="section.title || ''"
      loading="lazy"
      decoding="async"
      @error="imageFailed = true"
    />
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ISiteHomeSection } from '@/models';
import HomeSectionLink from './HomeSectionLink.vue';

defineProps<{ section: ISiteHomeSection }>();
const imageFailed = ref(false);
</script>
