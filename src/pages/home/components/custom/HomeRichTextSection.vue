<template>
  <article class="tenant-home-block tenant-home-rich-text">
    <h2 v-if="section.title">{{ section.title }}</h2>
    <vue-markdown :source="section.body || ''" sanitize />
  </article>
</template>

<script setup lang="ts">
import type { ISiteHomeSection } from '@/models';
import VueMarkdown from '@/components/common/VueMarkdown.vue';

defineProps<{ section: ISiteHomeSection }>();
</script>
