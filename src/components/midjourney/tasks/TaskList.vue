<template>
  <div v-if="tasks === undefined" class="p-2 flex flex-col overflow-y-auto">
    <bot-placeholder />
  </div>
  <div v-else-if="tasks && tasks?.length === 0" class="w-full h-full flex items-center justify-center">
    <no-tasks />
  </div>
  <div v-else-if="tasks.length > 0" ref="panel" class="p-2 flex flex-col overflow-y-auto" @scroll="onHandleScroll">
    <task-item v-for="(task, taskKey) in tasks" :key="taskKey" :model-value="task" @custom="$emit('custom', $event)" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskItem from './TaskItem.vue';
import BotPlaceholder from '@/components/common/BotPlaceholder.vue';
import NoTasks from '@/components/common/NoTasks.vue';

export default defineComponent({
  name: 'TaskList',
  components: {
    TaskItem,
    BotPlaceholder,
    NoTasks
  },
  emits: ['custom', 'reach-top'],
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
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      console.log('onHandleScroll  ', el.scrollTop);
      if (el.scrollTop === 0) {
        console.log('reach-top reach-top');
        this.$emit('reach-top');
      }
    }
  }
});
</script>
