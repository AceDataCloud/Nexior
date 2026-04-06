<template>
  <div class="rounded-xl border border-[var(--el-border-color-lighter)] p-5 bg-[var(--el-fill-color-blank)]">
    <h3 class="text-base font-bold mb-3">{{ $t('serp.name.imageResults') }}</h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <a
        v-for="(item, index) in data"
        :key="index"
        :href="item.link"
        target="_blank"
        rel="noopener noreferrer"
        class="group relative rounded-lg overflow-hidden bg-[var(--el-fill-color-light)] aspect-square"
      >
        <img
          v-if="item.image_url"
          :src="item.image_url"
          :alt="item.title"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <span class="text-xs text-white line-clamp-2">{{ item.title }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ISerpImageResult } from '@/models';

export default defineComponent({
  name: 'ImageResults',
  props: {
    data: {
      type: Array as PropType<ISerpImageResult[]>,
      required: true
    }
  }
});
</script>
