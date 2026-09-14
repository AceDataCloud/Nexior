<template>
  <article class="tenant-home-block tenant-home-html">
    <h2>{{ section.title }}</h2>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="tenant-home-content" v-html="section.body"></div>
  </article>
</template>

<script setup lang="ts">
import type { ISiteHomeSection } from '@/models';

defineProps<{ section: ISiteHomeSection }>();
</script>
