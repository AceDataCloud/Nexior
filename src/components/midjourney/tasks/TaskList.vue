<template>
  <div v-if="tasks === undefined" class="p-2 flex flex-col overflow-y-auto">
    <bot-placeholder />
  </div>
  <div v-else-if="tasks && tasks?.length === 0" class="w-full h-full flex items-center justify-center">
    <no-tasks />
  </div>
  <scroll-list
    v-else-if="tasks.length > 0"
    ref="scrollList"
    class="p-2 py-3 h-full flex flex-col overflow-y-auto tasks"
    :loading="loading"
    :floating-loader="floatingLoader"
    @reach-top="$emit('reach-top')"
  >
    <task-item
      v-for="task in tasks"
      :key="task.id"
      :model-value="task"
      @extend="$emit('extend', $event)"
      @custom="$emit('custom', $event)"
    />
  </scroll-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskItem from './TaskItem.vue';
import BotPlaceholder from '@/components/common/BotPlaceholder.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import ScrollList from '@/components/common/ScrollList.vue';

export default defineComponent({
  name: 'TaskList',
  components: {
    TaskItem,
    BotPlaceholder,
    NoTasks,
    ScrollList
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    floatingLoader: {
      type: Boolean,
      default: true
    }
  },
  emits: ['custom', 'extend', 'reach-top'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return this.$store.state.midjourney.tasks?.items;
    },
    application() {
      return this.$store.state.midjourney.application;
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
