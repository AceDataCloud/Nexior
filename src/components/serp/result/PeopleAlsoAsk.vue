<template>
  <div>
    <h3 class="text-base font-bold mb-3">{{ $t('serp.name.peopleAlsoAsk') }}</h3>
    <el-collapse>
      <el-collapse-item v-for="(item, index) in data" :key="index" :title="item.question || item.title || ''">
        <p v-if="item.snippet" class="text-sm text-gray-600 dark:text-gray-300 mb-2">{{ item.snippet }}</p>
        <a
          v-if="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-blue-500 hover:underline"
        >
          {{ item.title || item.link }}
        </a>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElCollapse, ElCollapseItem } from 'element-plus';
import { ISerpPeopleAlsoAsk } from '@/models';

export default defineComponent({
  name: 'PeopleAlsoAsk',
  components: {
    ElCollapse,
    ElCollapseItem
  },
  props: {
    data: {
      type: Array as PropType<ISerpPeopleAlsoAsk[]>,
      required: true
    }
  }
});
</script>
