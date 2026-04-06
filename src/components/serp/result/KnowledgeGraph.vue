<template>
  <div
    class="knowledge-graph rounded-xl border border-[var(--el-border-color-lighter)] p-5 bg-[var(--el-fill-color-blank)]"
  >
    <div class="flex flex-row gap-4">
      <img
        v-if="data.image_url"
        :src="data.image_url"
        :alt="data.title"
        class="w-28 h-28 rounded-lg object-cover flex-none shadow-sm"
      />
      <div class="flex-1 min-w-0">
        <div v-if="data.type" class="text-xs text-[var(--el-text-color-disabled)] mb-1 uppercase tracking-wide">
          {{ data.type }}
        </div>
        <h3 class="text-xl font-bold mb-1.5">{{ data.title }}</h3>
        <p v-if="data.description" class="text-sm text-[var(--el-text-color-regular)] mb-3 leading-relaxed">
          {{ data.description }}
          <a
            v-if="data.description_link"
            :href="data.description_link"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--el-color-primary)] hover:underline ml-1"
          >
            {{ data.description_source || 'Source' }}
          </a>
        </p>
        <div v-if="data.attributes && Object.keys(data.attributes).length" class="text-sm">
          <div v-for="(value, key) in data.attributes" :key="key" class="flex gap-2 mb-1 py-0.5">
            <span class="text-[var(--el-text-color-disabled)] flex-none font-medium">{{ key }}:</span>
            <span class="text-[var(--el-text-color-regular)]">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ISerpKnowledgeGraph } from '@/models';

export default defineComponent({
  name: 'KnowledgeGraph',
  props: {
    data: {
      type: Object as PropType<ISerpKnowledgeGraph>,
      required: true
    }
  }
});
</script>
