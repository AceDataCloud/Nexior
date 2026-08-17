<template>
  <div class="inspiration-masonry">
    <inspiration-card v-for="item in items" :key="item.id" :item="item" @select="$emit('select', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { ResolvedShowcase } from '@/models';
import InspirationCard from './InspirationCard.vue';

defineProps<{ items: ResolvedShowcase[] }>();
defineEmits<{ select: [item: ResolvedShowcase] }>();
</script>

<style lang="scss" scoped>
.inspiration-masonry {
  column-count: 4;
  column-gap: 16px;
}

@media (min-width: 1600px) {
  .inspiration-masonry {
    column-count: 5;
  }
}

@media (max-width: 1080px) {
  .inspiration-masonry {
    column-count: 3;
  }
}

@media (max-width: 760px) {
  .inspiration-masonry {
    column-count: 2;
    column-gap: 10px;
  }
}

@media (max-width: 480px) {
  .inspiration-masonry {
    column-count: 1;
  }
}
</style>
