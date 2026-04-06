<template>
  <div>
    <h3 class="text-base font-bold mb-3">{{ $t('serp.name.relatedSearches') }}</h3>
    <div class="flex flex-wrap gap-2">
      <el-tag
        v-for="(item, index) in data"
        :key="index"
        class="cursor-pointer"
        effect="plain"
        round
        @click="onSearch(item.query)"
      >
        {{ item.query }}
      </el-tag>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElTag } from 'element-plus';
import { ISerpRelatedSearch } from '@/models';

export default defineComponent({
  name: 'RelatedSearches',
  components: {
    ElTag
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
