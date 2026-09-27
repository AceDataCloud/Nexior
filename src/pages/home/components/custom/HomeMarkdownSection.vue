<template>
  <article class="tenant-home-block tenant-home-markdown">
    <h2>{{ section.title }}</h2>
    <vue-markdown
      class="tenant-home-content"
      :source="section.body"
      :style="section.height != null ? { height: `${section.height}px`, overflowY: 'auto' } : undefined"
      sanitize
    />
  </article>
</template>

<script setup lang="ts">
import type { ISiteHomeSection } from '@/models';
import VueMarkdown from '@/components/common/VueMarkdown.vue';

defineProps<{ section: ISiteHomeSection }>();
</script>
