<template>
  <div v-if="tasks?.items === undefined">
    <bot-placeholder />
  </div>
  <scroll-list
    v-else-if="tasks?.items?.length && tasks?.items?.length > 0"
    ref="scrollList"
    class="tasks w-full h-full overflow-y-auto"
    :loading="loading"
    @reach-top="$emit('reach-top')"
  >
    <task-preview v-for="task in tasks?.items" :key="task.id" :model-value="task" @extend="$emit('extend')" />
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
  name: 'RecentPanel',
  components: {
    BotPlaceholder,
    TaskPreview,
    NoTasks,
    ScrollList
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['reach-top', 'extend'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      // reverse the order of the tasks.items
      return {
        ...this.$store.state.luma?.tasks,
        items: this.$store.state.luma?.tasks?.items?.slice()
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
