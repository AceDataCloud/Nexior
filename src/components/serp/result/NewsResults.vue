<template>
  <div>
    <h3 class="text-base font-bold mb-3">{{ $t('serp.name.newsResults') }}</h3>
    <div class="space-y-4">
      <a
        v-for="(item, index) in data"
        :key="index"
        :href="item.link"
        target="_blank"
        rel="noopener noreferrer"
        class="flex gap-4 group"
      >
        <div class="flex-1 min-w-0">
          <div class="text-blue-600 group-hover:underline font-medium line-clamp-2">{{ item.title }}</div>
          <div class="text-xs text-gray-400 mt-1">
            <span v-if="item.source">{{ item.source }}</span>
            <span v-if="item.date"> &middot; {{ item.date }}</span>
          </div>
          <p v-if="item.snippet" class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {{ item.snippet }}
          </p>
        </div>
        <div
          v-if="item.image_url"
          class="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-gray-100 dark:bg-gray-800"
        >
          <img :src="item.image_url" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ISerpNewsResult } from '@/models';

export default defineComponent({
  name: 'NewsResults',
  props: {
    data: {
      type: Array as PropType<ISerpNewsResult[]>,
      required: true
    }
  }
});
</script>
