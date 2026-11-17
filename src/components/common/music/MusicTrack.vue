<template>
  <div class="audio" :class="{ active, generating }" @click.stop="$emit('select')">
    <slot name="selection" />
    <div v-loading="generating" class="left">
      <el-image :src="imageUrl" class="cover" fit="cover" lazy>
        <template #error>
          <div class="flex size-full items-center justify-center bg-[var(--el-fill-color-light)]">
            <music-icon :size="'24' as any" aria-hidden="true" focusable="false" />
          </div>
        </template>
      </el-image>
      <div v-if="variation" class="variation-badge">{{ variation }}</div>
      <button
        v-if="playable"
        type="button"
        class="play-btn"
        :aria-label="$t(playing ? 'common.player.pause' : 'common.player.play')"
        :title="$t(playing ? 'common.player.pause' : 'common.player.play')"
        @click.stop="playing ? $emit('pause') : $emit('play')"
      >
        <el-icon>
          <pause-icon v-if="playing" :size="'1em' as any" aria-hidden="true" focusable="false" />
          <play-icon v-else :size="'1em' as any" aria-hidden="true" focusable="false" />
        </el-icon>
      </button>
      <div v-if="duration" class="duration">{{ useFormatDuring(duration) }}</div>
    </div>
    <div class="info">
      <slot name="title">
        <div class="title-row">
          <h2 class="title">{{ title }}</h2>
          <meta-tag v-if="model" class="model-chip" tone="brand" density="compact">{{ model }}</meta-tag>
        </div>
      </slot>
      <p class="style">{{ trackStyle }}</p>
      <slot name="details" />
    </div>
    <div class="right"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
import { MetaTag } from '@acedatacloud/core/components';
import { MusicIcon, PauseIcon, PlayIcon } from '@acedatacloud/core/icons/components';
import { ElIcon, ElImage } from 'element-plus';
import { useFormatDuring } from '@/utils/number';

defineProps<{
  imageUrl?: string;
  duration?: number;
  title?: string;
  trackStyle?: string;
  model?: string;
  variation?: number;
  active?: boolean;
  playing?: boolean;
  playable?: boolean;
  generating?: boolean;
}>();
defineEmits<{ select: []; play: []; pause: [] }>();
</script>

<style lang="scss" src="./music.scss" />
