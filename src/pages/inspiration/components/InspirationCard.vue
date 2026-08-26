<template>
  <button type="button" class="inspiration-card" @click="$emit('select', item)">
    <span class="media">
      <img :src="item.posterUrl" :alt="item.altText" loading="lazy" decoding="async" />
      <span v-if="item.mediaType !== 'Image'" class="media-badge">
        {{ item.mediaType === 'Video' ? $t('intro.inspiration.video') : $t('intro.inspiration.audio') }}
      </span>
    </span>
    <span class="copy">
      <span class="service"><img :src="item.icon" alt="" />{{ item.name }}</span>
      <strong>{{ item.title }}</strong>
      <small>{{ item.prompt }}</small>
    </span>
  </button>
</template>

<script setup lang="ts">
import type { ResolvedShowcase } from '@/models';

defineProps<{ item: ResolvedShowcase }>();
defineEmits<{ select: [item: ResolvedShowcase] }>();
</script>

<style lang="scss" scoped>
.inspiration-card {
  display: block;
  width: 100%;
  margin: 0 0 16px;
  overflow: hidden;
  padding: 0;
  break-inside: avoid;
  border: 1px solid var(--app-border-subtle);
  border-radius: 15px;
  color: var(--el-text-color-primary);
  background: var(--app-surface-elevated);
  box-shadow: var(--app-shadow-sm);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--app-shadow-md);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 3px;
  }
}

.media {
  position: relative;
  display: block;
  background: #090d14;

  > img {
    display: block;
    width: 100%;
    height: auto;
    min-height: 150px;
    object-fit: cover;
  }
}

.media-badge {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 5px 9px;
  border-radius: 999px;
  color: #fff;
  background: rgba(5, 9, 16, 0.72);
  font-size: 11px;
  font-weight: 750;
  backdrop-filter: blur(8px);
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 13px 14px 15px;

  strong {
    font-size: 15px;
    line-height: 1.3;
  }

  small {
    display: -webkit-box;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.service {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 700;

  img {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    object-fit: cover;
  }
}

@media (prefers-reduced-motion: reduce) {
  .inspiration-card {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
