<template>
  <el-card class="knowledge-graph" shadow="hover">
    <div class="flex flex-row gap-4">
      <img
        v-if="data.image_url"
        :src="data.image_url"
        :alt="data.title"
        class="w-24 h-24 rounded object-cover flex-none"
      />
      <div class="flex-1 min-w-0">
        <div v-if="data.type" class="text-xs text-gray-400 mb-1">{{ data.type }}</div>
        <h3 class="text-lg font-bold mb-1">{{ data.title }}</h3>
        <p v-if="data.description" class="text-sm text-gray-600 dark:text-gray-300 mb-2">
          {{ data.description }}
          <a
            v-if="data.description_link"
            :href="data.description_link"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-500 hover:underline ml-1"
          >
            {{ data.description_source || 'Source' }}
          </a>
        </p>
        <div v-if="data.attributes && Object.keys(data.attributes).length" class="text-sm">
          <div v-for="(value, key) in data.attributes" :key="key" class="flex gap-2 mb-1">
            <span class="text-gray-400 flex-none">{{ key }}:</span>
            <span>{{ value }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElCard } from 'element-plus';
import { ISerpKnowledgeGraph } from '@/models';

export default defineComponent({
  name: 'KnowledgeGraph',
  components: {
    ElCard
  },
  props: {
    data: {
      type: Object as PropType<ISerpKnowledgeGraph>,
      required: true
    }
  }
});
</script>
