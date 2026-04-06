<template>
  <div>
    <h3 class="text-base font-bold mb-3">{{ $t('serp.name.imageResults') }}</h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <a
        v-for="(item, index) in data"
        :key="index"
        :href="item.link"
        target="_blank"
        rel="noopener noreferrer"
        class="group relative rounded overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square"
      >
        <img
          v-if="item.image_url"
          :src="item.image_url"
          :alt="item.title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
