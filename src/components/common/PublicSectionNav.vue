<template>
  <nav class="public-section-nav" :aria-label="$t('intro.inspiration.navigation')">
    <router-link :to="{ name: ROUTE_INDEX }" :class="{ active: $route.name === ROUTE_INDEX }">
      {{ $t('intro.inspiration.home') }}
    </router-link>
    <router-link :to="{ name: ROUTE_INSPIRATION_ALL }" :class="{ active: inspirationActive }">
      {{ $t('intro.inspiration.title') }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  ROUTE_INDEX,
  ROUTE_INSPIRATION_ALL,
  ROUTE_INSPIRATION_IMAGES,
  ROUTE_INSPIRATION_MUSIC,
  ROUTE_INSPIRATION_VIDEOS
} from '@/router/constants';

const route = useRoute();
const inspirationActive = computed(() =>
  [ROUTE_INSPIRATION_ALL, ROUTE_INSPIRATION_IMAGES, ROUTE_INSPIRATION_VIDEOS, ROUTE_INSPIRATION_MUSIC].includes(
    String(route.name)
  )
);
</script>

<style lang="scss" scoped>
.public-section-nav {
  display: flex;
  align-items: center;
  gap: 30px;
  min-height: 42px;

  a {
    position: relative;
    padding: 9px 2px 12px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    font-weight: 700;

    &::after {
      position: absolute;
      right: 0;
      bottom: 4px;
      left: 0;
      height: 2px;
      border-radius: 2px;
      background: var(--el-color-primary);
      content: '';
      opacity: 0;
      transform: scaleX(0.3);
      transition:
        opacity 0.18s ease,
        transform 0.18s ease;
    }

    &.active {
      color: var(--el-text-color-primary);

      &::after {
        opacity: 1;
        transform: scaleX(1);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 3px;
      border-radius: 4px;
    }
  }
}
</style>
