<template>
  <div class="organic-result">
    <div v-if="displayUrl" class="text-sm text-green-600 dark:text-green-400 truncate mb-0.5">
      {{ displayUrl }}
    </div>
    <a
      :href="data.link"
      target="_blank"
      rel="noopener noreferrer"
      class="title text-lg text-blue-600 hover:underline font-medium"
    >
      {{ data.title }}
    </a>
    <div v-if="data.date" class="text-xs text-gray-400 mt-0.5">{{ data.date }}</div>
    <p v-if="data.snippet" class="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
      {{ data.snippet }}
    </p>
    <div v-if="data.sitelinks?.length" class="mt-2 flex flex-wrap gap-2">
      <a
        v-for="(sitelink, index) in data.sitelinks"
        :key="index"
        :href="sitelink.link"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-blue-500 hover:underline"
      >
        {{ sitelink.title }}
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ISerpOrganicResult } from '@/models';

export default defineComponent({
  name: 'OrganicResult',
  props: {
    data: {
      type: Object as PropType<ISerpOrganicResult>,
      required: true
    }
  },
  computed: {
    displayUrl(): string {
      if (!this.data.link) return '';
      try {
        const url = new URL(this.data.link);
        return url.hostname + url.pathname;
      } catch {
        return this.data.link;
      }
    }
  }
});
</script>
