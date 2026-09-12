<template>
  <router-link v-if="target?.kind === 'route'" :to="target.to" class="tenant-home-link"><slot /></router-link>
  <a
    v-else-if="target?.kind === 'external'"
    :href="target.href"
    target="_blank"
    rel="noopener noreferrer"
    class="tenant-home-link"
  >
    <slot />
  </a>
  <span v-else class="tenant-home-link is-disabled"><slot /></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveHomeNavigation } from '@/utils/homeNavigation';

const props = defineProps<{ href?: string | null }>();
const target = computed(() => resolveHomeNavigation(props.href));
</script>
