<template>
  <div v-if="tasks?.items === undefined">
    <bot-placeholder />
  </div>
  <div v-else-if="tasks?.items?.length && tasks?.items?.length > 0" class="tasks h-full w-full overflow-y-auto">
    <task-preview v-for="task in tasks?.items" :key="task.id" :model-value="task" />
  </div>
  <div v-if="tasks?.items?.length === 0" class="w-full h-full flex items-center justify-center">
    <no-tasks />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import BotPlaceholder from '../common/BotPlaceholder.vue';
import NoTasks from '@/components/common/NoTasks.vue';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview,
    BotPlaceholder,
    NoTasks
  },
  emits: ['reach-top'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      return {
        ...this.$store.state.nanobanana?.tasks,
        items: this.$store.state.nanobanana?.tasks?.items?.slice()
      };
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      if (el.scrollTop === 0) {
        this.$emit('reach-top');
      }
    }
  }
});
</script>

