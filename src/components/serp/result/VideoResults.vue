<template>
  <div>
    <h3 class="text-base font-bold mb-3">{{ $t('serp.name.videoResults') }}</h3>
    <div class="space-y-4">
      <a
        v-for="(item, index) in data"
        :key="index"
        :href="item.link"
        target="_blank"
        rel="noopener noreferrer"
        class="flex gap-4 group"
      >
        <div class="relative flex-shrink-0 w-40 h-24 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.title"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div v-if="item.duration" class="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            {{ item.duration }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-blue-600 group-hover:underline font-medium line-clamp-2">{{ item.title }}</div>
          <div class="text-xs text-gray-400 mt-1">
            <span v-if="item.source">{{ item.source }}</span>
            <span v-if="item.channel"> &middot; {{ item.channel }}</span>
            <span v-if="item.date"> &middot; {{ item.date }}</span>
          </div>
          <p v-if="item.snippet" class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {{ item.snippet }}
          </p>
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ISerpVideoResult } from '@/models';

export default defineComponent({
  name: 'VideoResults',
  props: {
    data: {
      type: Array as PropType<ISerpVideoResult[]>,
      required: true
    }
  }
});
</script>
