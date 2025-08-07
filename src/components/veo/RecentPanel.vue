<template>
  <div v-if="tasks?.items === undefined">
    <bot-placeholder />
  </div>
  <div v-else-if="tasks?.items?.length && tasks?.items?.length > 0" class="h-full w-full overflow-y-auto">
    <task-preview v-for="(task, taskIndex) in tasks?.items" :key="taskIndex" :model-value="task" />
  </div>
  <div v-if="tasks?.items?.length === 0" class="w-full h-full flex items-center justify-center">
    <no-tasks />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import BotPlaceholder from '@/components/common/BotPlaceholder.vue';
import NoTasks from '@/components/common/NoTasks.vue';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview,
    NoTasks,
    BotPlaceholder
  },
  emits: ['reach-top'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      // reverse the order of the tasks.items
      return {
        ...this.$store.state.veo?.tasks,
        items: this.$store.state.veo?.tasks?.items?.slice()
      };
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      console.log('reach-top reach-top reach-top');
      if (el.scrollTop === 0) {
        this.$emit('reach-top');
      }
    }
  }
});
</script>
