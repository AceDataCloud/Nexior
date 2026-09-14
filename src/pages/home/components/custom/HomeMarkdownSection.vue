<template>
  <article class="tenant-home-block tenant-home-markdown">
    <h2>{{ section.title }}</h2>
    <vue-markdown class="tenant-home-content" :source="section.body" sanitize />
  </article>
</template>

<script setup lang="ts">
import type { ISiteHomeSection } from '@/models';
import VueMarkdown from '@/components/common/VueMarkdown.vue';

defineProps<{ section: ISiteHomeSection }>();
</script>
