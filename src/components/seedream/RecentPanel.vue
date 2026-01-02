<template>
  <div v-if="tasks?.items === undefined">
    <bot-placeholder />
  </div>
  <scroll-list
    v-else-if="tasks?.items?.length && tasks?.items?.length > 0"
    ref="scrollList"
    class="tasks h-full w-full overflow-y-auto"
    :loading="loading"
    @reach-top="$emit('reach-top')"
  >
    <task-preview v-for="task in tasks?.items" :key="task.id" :model-value="task" />
  </scroll-list>
  <div v-if="tasks?.items?.length === 0" class="w-full h-full flex items-center justify-center">
    <no-tasks />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import BotPlaceholder from '../common/BotPlaceholder.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import ScrollList from '@/components/common/ScrollList.vue';

export default defineComponent({
  name: 'SeedreamRecentPanel',
  components: {
    TaskPreview,
    BotPlaceholder,
    NoTasks,
    ScrollList
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['reach-top'],
  computed: {
    tasks() {
      return {
        ...this.$store.state.seedream?.tasks,
        items: this.$store.state.seedream?.tasks?.items?.slice()
      };
    }
  },
  methods: {
    getScrollElement(): HTMLElement | undefined {
      const list = this.$refs.scrollList as any;
      return list?.getScrollElement?.();
    }
  }
});
</script>
