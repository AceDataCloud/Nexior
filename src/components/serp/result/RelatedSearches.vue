<template>
  <div class="rounded-xl border border-[var(--el-border-color-lighter)] p-5 bg-[var(--el-fill-color-blank)]">
    <h3 class="text-base font-bold mb-3">{{ $t('serp.name.relatedSearches') }}</h3>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="(item, index) in data"
        :key="index"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[var(--el-fill-color-light)] text-[var(--el-text-color-regular)] hover:bg-[var(--el-color-primary-light-9)] hover:text-[var(--el-color-primary)] transition-colors cursor-pointer border-none"
        @click="onSearch(item.query)"
      >
        <font-awesome-icon icon="fa-solid fa-magnifying-glass" class="text-xs opacity-50" />
        {{ item.query }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ISerpRelatedSearch } from '@/models';

export default defineComponent({
  name: 'RelatedSearches',
  components: {
    FontAwesomeIcon
  },
  props: {
    data: {
      type: Array as PropType<ISerpRelatedSearch[]>,
      required: true
    }
  },
  emits: ['search'],
  methods: {
    onSearch(query: string | undefined) {
      if (query) {
        this.$emit('search', query);
      }
    }
  }
});
</script>
